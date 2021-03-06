import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  EstimatorService,
  Member,
  retrieveRoomData,
  RoomData,
} from '../estimator.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-or-join-room',
  templateUrl: './create-or-join-room.component.html',
  styleUrls: ['./create-or-join-room.component.scss'],
})
export class CreateOrJoinRoomComponent implements OnInit {
  name = new FormControl('');
  roomId = new FormControl('');
  isBusy = false;

  constructor(
    private estimatorService: EstimatorService,
    private router: Router,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const roomIdFromParams = this.activatedRoute.snapshot.queryParamMap.get(
      'roomId'
    );
    if (roomIdFromParams) {
      this.roomId.setValue(roomIdFromParams);
      this.roomId.disable();
    }

    const savedRoomData = retrieveRoomData();

    if (savedRoomData) {
      const snackbarRef = this.snackBar.open(
        `Do you want to re-join your last estimation, ${savedRoomData.roomId}?`,
        'Join',
        { duration: 10000 }
      );
      snackbarRef.onAction().subscribe(() => this.joinLastRoom(savedRoomData));
    }
  }

  async joinLastRoom(savedRoomData: RoomData) {
    this.isBusy = true;
    this.estimatorService.refreshCurrentRoom(
      savedRoomData.roomId,
      savedRoomData.memberId
    );
    const roomSubscrption = this.estimatorService.currentRoom.subscribe(
      (room) => {
        if (room) {
          this.router
            .navigate([savedRoomData.roomId])
            .then(() => roomSubscrption.unsubscribe());
        }
        this.isBusy = false;
      },
      (error) => {
        this.isBusy = false;
        console.error(error);
        this.showUnableToJoinRoom();
      }
    );
  }

  async joinRoom() {
    const member: Member = {
      id: null,
      name: this.name.value,
    };

    try {
      this.isBusy = true;
      await this.estimatorService.joinRoom(this.roomId.value, member);
      this.router.navigate([this.roomId.value]);
    } catch (e) {
      this.showUnableToJoinRoom();
    } finally {
      this.isBusy = false;
    }
  }

  showUnableToJoinRoom() {
    this.snackBar.open(
      'Unable to join room. Please check the ID and try again.',
      null,
      { duration: 2000 }
    );
  }

  async createRoom() {
    const newMember: Member = {
      id: null,
      name: this.name.value,
    };

    this.isBusy = true;
    const { room } = await this.estimatorService.createRoom(newMember);
    this.router.navigate([room.roomId]);
    this.isBusy = false;
  }
}
