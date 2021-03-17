import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import * as generate from 'project-name-generator';
import { Observable } from 'rxjs';
import * as firebase from 'firebase/app';
import { tap, catchError } from 'rxjs/operators';

export interface Room {
  id: string;
  roomId: string;
  members: Member[];
  rounds: { [roundNumber: number]: Round };
  isOpen: boolean;
}

export interface Round {
  id: string;
  topic: string;
  started_at: firebase.firestore.Timestamp;
  finished_at: firebase.firestore.Timestamp;
  estimates: { [memberId: string]: number };
  show_results: boolean;
}
export interface Member {
  id: string;
  name: string;
}

export interface RoomData {
  roomId: string;
  memberId: string;
}

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

export const retrieveRoomData = (): RoomData | undefined => {
  if (window.localStorage) {
    return JSON.parse(window.localStorage.getItem(LAST_ROOM_DATA));
  }
};

@Injectable({
  providedIn: 'root',
})
export class EstimatorService {
  ROOMS_COLLECTION = 'rooms';

  currentRoom: Observable<Room> = new Observable<Room>();
  activeMember: Member;

  constructor(private firestore: AngularFirestore) {}

  async createRoom(member: Member) {
    member.id = this.firestore.createId();

    const room: Room = {
      id: this.firestore.createId(),
      roomId: generate().dashed,
      members: [member],
      rounds: { 0: this.createRound([member], 1) },
      isOpen: true,
    };

    await this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(room.roomId)
      .set(room);

    this.refreshCurrentRoom(room.id, member.id);
    this.activeMember = member;

    saveJoinedRoomData({ roomId: room.roomId, memberId: member.id });

    return { room, member };
  }

  async joinRoom(roomId: string, member: Member) {
    if (!member.id) {
      member.id = this.firestore.createId();
    }

    await this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(roomId)
      .update({
        members: firebase.firestore.FieldValue.arrayUnion(member),
      });

    this.refreshCurrentRoom(roomId, member.id);
    this.activeMember = member;

    saveJoinedRoomData({ roomId, memberId: member.id });

    return member;
  }

  async removeMember(roomId: string, member: Member) {
    await this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(roomId)
      .update({
        members: firebase.firestore.FieldValue.arrayRemove(member),
      });
  }

  refreshCurrentRoom(roomId: string, memberId: string) {
    this.currentRoom = this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc<Room>(roomId)
      .valueChanges()
      .pipe(
        tap((room) => {
          if (!room) {
            throw new RoomNotFoundError();
          }
          console.log(memberId);
          this.activeMember = room.members.find((m) => m.id === memberId);
          console.log(this.activeMember, room.members);
        })
      );
  }

  updateRoom(room: Room) {
    this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(room.roomId)
      .update(room);
  }

  setTopic(room: Room, round: number, topic: string) {
    return this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(room.roomId)
      .update({ [`rounds.${round}.topic`]: topic });
  }

  setShowResults(room: Room, round: number, showResults: boolean) {
    return this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(room.roomId)
      .update({ [`rounds.${round}.show_results`]: showResults });
  }

  newRound(room: Room) {
    const currentRoundId = Object.keys(room.rounds).length - 1;
    const nextRoundId = currentRoundId + 1;
    const nextRoundNumber = nextRoundId + 1;
    room.rounds[
      currentRoundId
    ].finished_at = firebase.firestore.Timestamp.now();
    room.rounds[nextRoundId] = this.createRound(room.members, nextRoundNumber);
    return this.updateRoom(room);
  }

  setEstimate(
    room: Room,
    roundNumber: number,
    estimate: number,
    userId: string
  ) {
    return this.firestore
      .collection('rooms')
      .doc(room.roomId)
      .update({ [`rounds.${roundNumber}.estimates.${userId}`]: estimate });
  }

  createRound(members: Member[], roundNumber: number): Round {
    return {
      id: this.firestore.createId(),
      topic: `Topic of Round ${roundNumber}`,
      started_at: firebase.firestore.Timestamp.now(),
      finished_at: null,
      estimates: {},
      show_results: false,
    };
  }
}
