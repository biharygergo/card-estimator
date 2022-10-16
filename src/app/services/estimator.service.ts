import { Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  collectionData,
  docData,
  Firestore,
  query,
  where,
} from '@angular/fire/firestore';
import * as generate from 'project-name-generator';
import { combineLatest, firstValueFrom, from, Observable, of } from 'rxjs';
import { first, map, switchMap, tap } from 'rxjs/operators';
import {
  RoomData,
  Room,
  Member,
  CardSet,
  Round,
  Notes,
  CardSetValue,
  CustomCardSet,
  MemberStatus,
} from './../types';
import {
  collection,
  CollectionReference,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { DocumentReference } from 'rxfire/firestore/interfaces';
import { AuthService } from './auth.service';
import { createHash } from '../utils';

export class MemberNotFoundError extends Error {}
export class RoomNotFoundError extends Error {}
export class NotLoggedInError extends Error {}

const LAST_ROOM_DATA = 'CARD_ESTIMATOR_LAST_ROOM_DATA';

export const saveJoinedRoomData = (roomData: RoomData | undefined) => {
  if (window.localStorage) {
    if (roomData) {
      window.localStorage.setItem(LAST_ROOM_DATA, JSON.stringify(roomData));
    } else {
      window.localStorage.removeItem(LAST_ROOM_DATA);
    }
  }
};

const isNewerThanTwoWeeks = (roomDate: Date) => {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return twoWeeksAgo.getTime() < roomDate.getTime();
};

export const retrieveRoomData = (): RoomData | undefined => {
  if (window.localStorage) {
    const data = JSON.parse(window.localStorage.getItem(LAST_ROOM_DATA)) as
      | RoomData
      | undefined;
    if (
      data &&
      data.createdAt &&
      isNewerThanTwoWeeks(new Date(data.createdAt))
    ) {
      return data;
    } else {
      saveJoinedRoomData(undefined);
      return undefined;
    }
  }
};

@Injectable({
  providedIn: 'root',
})
export class EstimatorService {
  ROOMS_COLLECTION = 'rooms';
  INVITATIONS_COLLECTION = 'invitations';

  activeMember: Member;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  private async signInAsMember(member: Member) {
    let user = await this.authService.getUser();
    let userId = user?.uid;

    if (user && !user?.displayName) {
      try {
        await this.authService.updateDisplayName(user, member.name);
      } catch {
        console.error('Failed to update display name');
      }
    }

    if (!userId) {
      const newUser = await this.authService.loginAnonymously(member.name);
      userId = newUser.uid;
    }

    member.id = userId;
    if (user?.photoURL) {
      member.avatarUrl = user.photoURL;
    }
  }

  getRoom(roomId: string): Promise<Room> {
    return firstValueFrom(
      docData<Room>(
        doc(
          this.firestore,
          this.ROOMS_COLLECTION,
          roomId
        ) as DocumentReference<Room>
      ).pipe(
        first(),
        tap((room) => {
          if (!room) {
            throw new RoomNotFoundError();
          }
        })
      )
    );
  }

  async createRoom(member: Member): Promise<{ room: Room; member: Member }> {
    await this.signInAsMember(member);

    const room: Room = {
      id: this.createId(),
      roomId: generate({ words: 3 }).dashed,
      members: [member],
      rounds: { 0: this.createRound([member], 1) },
      currentRound: 0,
      isOpen: true,
      createdAt: serverTimestamp(),
      cardSet: CardSet.DEFAULT,
      createdById: member.id,
      memberIds: [member.id],
    };

    await setDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), room);

    this.activeMember = member;

    saveJoinedRoomData({
      roomId: room.roomId,
      memberId: member.id,
      createdAt: new Date().toISOString(),
    });

    return { room, member };
  }

  async joinRoom(roomId: string, member: Member) {
    await this.signInAsMember(member);

    const existingRoom = await this.getRoom(roomId);
    const updatedMembers = existingRoom.members.filter(
      (m) => m.id !== member.id
    );

    updatedMembers.push(member);

    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: updatedMembers,
      memberIds: arrayUnion(member.id),
    });

    this.activeMember = member;

    saveJoinedRoomData({
      roomId,
      memberId: member.id,
      createdAt: new Date().toISOString(),
    });

    return member;
  }

  async leaveRoom(roomId: string, member: Member) {
    const room = await this.getRoom(roomId);
    const updatedMembers = [...room.members];
    const updatedMember = room.members.find((m) => m.id === member.id);

    updatedMember.status = MemberStatus.LEFT_ROOM;

    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: updatedMembers,
    });
  }

  async removeMember(roomId: string, member: Member) {
    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: arrayRemove(member),
    });
  }

  getRoomById(roomId: string): Observable<Room> {
    return combineLatest([
      this.authService.user,
      docData<Room>(
        doc(
          this.firestore,
          this.ROOMS_COLLECTION,
          roomId
        ) as DocumentReference<Room>
      ),
    ]).pipe(
      tap(([user, room]) => {
        if (!room) {
          throw new RoomNotFoundError();
        }
        this.activeMember = room.members.find((m) => m.id === user.uid);
      }),
      map(([_user, room]) => room)
    );
  }

  updateRoom(room: Room) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      ...room,
    });
  }

  setTopic(room: Room, round: number, topic: string) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${round}.topic`]: topic,
    });
  }

  setShowResults(room: Room, round: number, showResults: boolean) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${round}.show_results`]: showResults,
    });
  }

  private getRoundIds(room: Room) {
    const currentRoundId =
      room.currentRound ?? Object.keys(room.rounds).length - 1;
    const numberOfRounds = Object.keys(room.rounds).length;
    const nextRoundId = numberOfRounds;
    const nextRoundNumber = nextRoundId + 1;

    return { currentRoundId, numberOfRounds, nextRoundId, nextRoundNumber };
  }

  newRound(room: Room) {
    const { currentRoundId, nextRoundId, nextRoundNumber } =
      this.getRoundIds(room);
    room.rounds[currentRoundId].finished_at = serverTimestamp();
    room.currentRound = nextRoundId;
    room.rounds[nextRoundId] = this.createRound(room.members, nextRoundNumber);
    return this.updateRoom(room);
  }

  addRound(room: Room, topic: string) {
    const { nextRoundId, nextRoundNumber } = this.getRoundIds(room);

    room.rounds[nextRoundId] = this.createRound(
      room.members,
      nextRoundNumber,
      topic
    );
    return this.updateRoom(room);
  }

  setActiveRound(room: Room, roundId: number, shouldRevote: boolean) {
    room.currentRound = roundId;
    if (shouldRevote) {
      const round = room.rounds[roundId];
      room.rounds[roundId] = this.revoteRound(round);
    }
    return this.updateRoom(room);
  }

  setEstimate(
    room: Room,
    roundNumber: number,
    estimate: number,
    userId: string
  ) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${roundNumber}.estimates.${userId}`]: estimate,
    });
  }

  setRoomCardSet(roomId: string, selectedSet: CardSet) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      cardSet: selectedSet,
    });
  }

  createRound(members: Member[], roundNumber: number, topic?: string): Round {
    return {
      id: this.createId(),
      topic: topic ?? `Topic of Round ${roundNumber}`,
      started_at: serverTimestamp(),
      finished_at: null,
      estimates: {},
      show_results: false,
      notes: {
        note: '',
        editedBy: null,
      },
    };
  }

  revoteRound(round: Round): Round {
    return {
      ...round,
      started_at: serverTimestamp(),
      finished_at: null,
      estimates: {},
      show_results: false,
    };
  }

  setNote(note: string, room: Room, member: Member) {
    const newNote: Notes = {
      note,
      editedBy: member || null,
    };
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes`]: newNote,
    });
  }

  setNoteEditor(room: Room, member: Member | null) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes.editedBy`]: member || null,
    });
  }

  setRoomCustomCardSetValue(roomId: string, selectedSet: CardSetValue) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      cardSet: CustomCardSet,
      customCardSetValue: selectedSet,
    });
  }

  updateCurrentUserMemberAvatar(room: Room, avatarUrl: string | null) {
    const newMembers = [...room.members];
    const member = newMembers.find((m) => m.id === this.activeMember.id);
    member.avatarUrl = avatarUrl;
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      members: newMembers,
    });
  }

  updateCurrentUserMemberName(room: Room, name: string) {
    const newMembers = [...room.members];
    const member = newMembers.find((m) => m.id === this.activeMember.id);
    member.name = name;
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      members: newMembers,
    });
  }

  saveInvitation(invitationId: string, roomId: string) {
    return setDoc(
      doc(
        this.firestore,
        this.INVITATIONS_COLLECTION,
        createHash(invitationId)
      ),
      {
        roomId,
        invitationId,
        invitedBy: this.activeMember.id || null,
        createdAt: serverTimestamp(),
      }
    );
  }

  getPreviousSessions(): Observable<Room[]> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }
        const ref = collection(
          this.firestore,
          this.ROOMS_COLLECTION
        ) as CollectionReference<Room>;
        const q = query<Room>(
          ref,
          where('memberIds', 'array-contains', user.uid)
        );

        return collectionData<Room>(q);
      })
    );
  }
}
