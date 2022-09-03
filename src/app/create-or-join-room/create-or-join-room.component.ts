import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  EstimatorService,
  retrieveRoomData,
} from '../services/estimator.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RoomData, Member } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';

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
    private activatedRoute: ActivatedRoute,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();

    const roomIdFromParams =
      this.activatedRoute.snapshot.queryParamMap.get('roomId');
    const hasError = this.activatedRoute.snapshot.queryParamMap.get('error');

    if (roomIdFromParams) {
      this.roomId.setValue(roomIdFromParams);
      this.roomId.disable();
      this.analytics.logAutoFilledRoomId();
    }

    const savedRoomData = retrieveRoomData();

    this.authService.getUser().then((user) => {
      if (user?.displayName) {
        this.name.setValue(user.displayName);
      }
      if (savedRoomData && user?.uid === savedRoomData.memberId && !hasError) {
        const snackbarRef = this.snackBar.open(
          `Do you want to re-join your last estimation, ${savedRoomData.roomId}?`,
          'Join',
          { duration: 10000 }
        );
        snackbarRef
          .onAction()
          .subscribe(() => this.joinLastRoom(savedRoomData));
      }
    });
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
          this.analytics.logClickedJoinLastRoom();
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
      this.snackBar.dismiss();

      this.isBusy = true;
      await this.estimatorService.joinRoom(this.roomId.value, member);

      this.analytics.logClickedJoinedRoom();
      this.router.navigate([this.roomId.value]);
    } catch (e) {
      this.showUnableToJoinRoom();
    } finally {
      this.isBusy = false;
    }
  }

  async joinRoomAsObserver() {
    const member: Member = {
      id: null,
      name: this.name.value,
    };

    try {
      this.isBusy = true;
      this.snackBar.dismiss();
      await this.estimatorService.joinRoomAsObserver(this.roomId.value, member);
      this.analytics.logClickedJoinAsObserver();
      return this.router.navigate([this.roomId.value], {
        queryParams: { observing: 1 },
      });
    } catch {
      this.showUnableToJoinRoom();
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
    this.analytics.logClickedCreateNewRoom();
    this.router.navigate([room.roomId]);
    this.isBusy = false;
  }

  onNameBlur() {
    this.analytics.logFilledNameInput();
  }

  onRoomIdBlur() {
    this.analytics.logFilledRoomId();
  }
}
