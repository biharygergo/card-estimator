import { Component, OnInit, OnDestroy } from '@angular/core';
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

import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  Subject,
} from 'rxjs';
import {
  filter,
  finalize,
  first,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { User } from 'firebase/auth';

enum PageMode {
  CREATE = 'create',
  JOIN = 'join',
}

enum JoinMode {
  OBSERVER = 'observer',
  ESTIMATOR = 'estimator',
}

interface ViewModel {
  user: User | undefined;
  roomId: string | undefined;
  mode: PageMode;
}

@Component({
  selector: 'app-create-or-join-room',
  templateUrl: './create-or-join-room.component.html',
  styleUrls: ['./create-or-join-room.component.scss'],
})
export class CreateOrJoinRoomComponent implements OnInit, OnDestroy {
  name = new FormControl('');
  roomId = new FormControl('');
  joinAs = new FormControl(JoinMode.ESTIMATOR);

  isBusy = new BehaviorSubject<boolean>(false);
  onJoinRoomClicked = new Subject<void>();
  onCreateRoomClicked = new Subject<void>();
  destroy = new Subject<void>();

  user = combineLatest([this.authService.user, this.isBusy]).pipe(
    filter(([_, busy]) => !busy),
    tap(([user]) => {
      if (user) {
        this.name.setValue(user.displayName);
      }
    }),
    map(([user]) => user)
  );

  roomIdFromParams: Observable<string> = this.activatedRoute.queryParamMap.pipe(
    map((paramMap) => paramMap.get('roomId')),
    tap((roomId) => {
      if (roomId) {
        this.roomId.setValue(roomId);
        this.analytics.logAutoFilledRoomId();
      }
    })
  );

  currentPath: Observable<string> = this.activatedRoute.url.pipe(
    map((segments) => [...segments]?.pop()?.path)
  );

  vm: Observable<ViewModel> = combineLatest([
    this.roomIdFromParams,
    this.currentPath,
    this.user,
    this.isBusy,
  ]).pipe(
    filter(([_params, _path, _user, busy]) => !busy),
    map(([roomIdFromParams, currentPath, user]) => {
      const roomId = roomIdFromParams;
      const mode = currentPath === 'create' ? PageMode.CREATE : PageMode.JOIN;
      return { roomId, mode, user };
    })
  );

  readonly PageMode = PageMode;
  readonly JoinMode = JoinMode;

  constructor(
    private estimatorService: EstimatorService,
    private router: Router,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private readonly cookieService: CookieService
  ) {}

  ngOnInit(): void {
    this.isBusy.pipe(tap((busy) => console.log(busy)));

    this.cookieService.tryShowCookieBanner();

    const hasError = this.activatedRoute.snapshot.queryParamMap.get('error');

    const savedRoomData = retrieveRoomData();

    this.authService.getUser().then((user) => {
      if (savedRoomData && user?.uid === savedRoomData.memberId && !hasError) {
        const snackbarRef = this.snackBar.open(
          `Do you want to re-join your last estimation, ${savedRoomData.roomId}?`,
          'Join',
          { duration: 10000 }
        );
        snackbarRef
          .onAction()
          .pipe(takeUntil(this.destroy))
          .subscribe(() => this.joinLastRoom(savedRoomData));
      }
    });

    this.onJoinRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() => from(this.joinRoom())),
        first(),
        takeUntil(this.destroy),
        finalize(() => this.isBusy.next(false))
      )
      .subscribe();

    this.onCreateRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() => from(this.createRoom())),
        first(),
        takeUntil(this.destroy),
        finalize(() => this.isBusy.next(false))
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async joinLastRoom(savedRoomData: RoomData) {
    this.isBusy.next(true);
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
        this.isBusy.next(false);
      },
      (error) => {
        this.isBusy.next(false);
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
      const isObserver = this.joinAs.value === JoinMode.OBSERVER;
      await this.estimatorService.joinRoom(
        this.roomId.value,
        member,
        isObserver
      );

      if (isObserver) {
        this.analytics.logClickedJoinAsObserver();
      } else {
        this.analytics.logClickedJoinedRoom();
      }

      const queryParams = isObserver ? { observing: 1 } : {};
      return this.router.navigate(['room', this.roomId.value], {
        queryParams,
      });
    } catch (e) {
      this.showUnableToJoinRoom();
    }
  }

  showUnableToJoinRoom() {
    this.snackBar.open(
      'Unable to join room. Please check the ID and try again.',
      null,
      { duration: 2000 }
    );
  }

  signOut() {
    return this.authService.signOut();
  }

  async createRoom() {
    const newMember: Member = {
      id: null,
      name: this.name.value,
    };

    const isObserver = this.joinAs.value === JoinMode.OBSERVER;

    const { room } = await this.estimatorService.createRoom(
      newMember,
      isObserver
    );
    this.analytics.logClickedCreateNewRoom();
    const queryParams = isObserver ? { observing: 1 } : {};
    return this.router.navigate(['room', room.roomId], {
      queryParams,
    });
  }

  onNameBlur() {
    this.analytics.logFilledNameInput();
  }

  onRoomIdBlur() {
    this.analytics.logFilledRoomId();
  }
}
