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
  rounds: Round[];
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

export class MemberNotFoundError extends Error {}
export class RoomNotFoundError extends Error {}

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
      rounds: [this.createRound([member], 1)],
      isOpen: true,
    };

    await this.firestore
      .collection(this.ROOMS_COLLECTION)
      .doc(room.roomId)
      .set(room);

    this.refreshCurrentRoom(room.id, member.id);
    this.activeMember = member;

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

    return member;
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
          this.activeMember = room.members.find((m) => m.id === memberId);
        })
      );
  }

  updateRoom(room: Room) {
    this.firestore.collection(this.ROOMS_COLLECTION).doc(room.roomId).set(room);
  }

  newRound(room: Room) {
    room.rounds[
      room.rounds.length - 1
    ].finished_at = firebase.firestore.Timestamp.now();
    room.rounds.push(this.createRound(room.members, room.rounds.length + 1));
    this.updateRoom(room);
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
