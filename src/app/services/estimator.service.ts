import { Injectable } from '@angular/core';
import {
  arrayRemove,
  arrayUnion,
  docData,
  Firestore,
} from '@angular/fire/firestore';
import * as generate from 'project-name-generator';
import { lastValueFrom, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  RoomData,
  Room,
  Member,
  CardSet,
  Round,
  Notes,
  CardSetValue,
  CustomCardSet,
} from './../types';
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { DocumentReference } from 'rxfire/firestore/interfaces';
import { AuthService } from './auth.service';

export class MemberNotFoundError extends Error {}
export class RoomNotFoundError extends Error {}

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

  currentRoom: Observable<Room> = new Observable<Room>();
  activeMember: Member;

  constructor(private firestore: Firestore, private authService: AuthService) {}

  createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  private async signInAsMember(member: Member) {
    let user = await this.authService.getUser();
    let userId = user?.uid;
  
    if (!userId) {
      const newUser = await this.authService.loginAnonymously(member.name);
      userId = newUser.uid;
    }
  
    member.id = userId;
  }

  async createRoom(member: Member) {
    await this.signInAsMember(member)

    const room: Room = {
      id: this.createId(),
      roomId: generate().dashed,
      members: [member],
      rounds: { 0: this.createRound([member], 1) },
      currentRound: 0,
      isOpen: true,
      createdAt: serverTimestamp(),
      cardSet: CardSet.DEFAULT,
    };

    await setDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), room);

    this.refreshCurrentRoom(room.roomId, member.id);
    this.activeMember = member;

    saveJoinedRoomData({
      roomId: room.roomId,
      memberId: member.id,
      createdAt: new Date().toISOString(),
    });

    return { room, member };
  }

  async joinRoom(roomId: string, member: Member) {
    await this.signInAsMember(member)

    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: arrayUnion(member),
    });

    this.refreshCurrentRoom(roomId, member.id);
    this.activeMember = member;

    saveJoinedRoomData({
      roomId,
      memberId: member.id,
      createdAt: new Date().toISOString(),
    });

    return member;
  }

  async removeMember(roomId: string, member: Member) {
    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: arrayRemove(member),
    });
  }

  refreshCurrentRoom(roomId: string, memberId: string) {
    this.currentRoom = docData<Room>(
      doc(
        this.firestore,
        this.ROOMS_COLLECTION,
        roomId
      ) as DocumentReference<Room>
    ).pipe(
      tap((room) => {
        if (!room) {
          throw new RoomNotFoundError();
        }
        this.activeMember = room.members.find((m) => m.id === memberId);
      })
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

  newRound(room: Room) {
    const currentRoundId =
      room.currentRound ?? Object.keys(room.rounds).length - 1;
    const numberOfRounds = Object.keys(room.rounds).length;
    const nextRoundId = numberOfRounds;
    const nextRoundNumber = nextRoundId + 1;
    room.rounds[currentRoundId].finished_at = serverTimestamp();
    room.currentRound = nextRoundId;
    room.rounds[nextRoundId] = this.createRound(room.members, nextRoundNumber);
    return this.updateRoom(room);
  }

  setActiveRound(room: Room, roundId: number) {
    room.currentRound = roundId;
    const round = room.rounds[roundId];
    room.rounds[roundId] = this.revoteRound(round);
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

  createRound(members: Member[], roundNumber: number): Round {
    return {
      id: this.createId(),
      topic: `Topic of Round ${roundNumber}`,
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
      editedBy: member,
    };
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes`]: newNote,
    });
  }

  setNoteEditor(room: Room, member: Member | null) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes.editedBy`]: member,
    });
  }

  setRoomCustomCardSetValue(roomId: string, selectedSet: CardSetValue) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      cardSet: CustomCardSet,
      customCardSetValue: selectedSet,
    });
  }
}
