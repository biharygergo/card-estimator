import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EstimatorService } from '../services/estimator.service';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Member, MemberType, MemberStatus } from '../types';
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
  startWith,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { User } from 'firebase/auth';
import { AppConfig, APP_CONFIG } from '../app-config.module';
import { delayedFadeAnimation, fadeAnimation } from '../shared/animations';
import { ZoomApiService } from '../services/zoom-api.service';
import { MatDialog } from '@angular/material/dialog';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../shared/auth-progress-dialog/auth-progress-dialog.component';

enum PageMode {
  CREATE = 'create',
  JOIN = 'join',
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
  animations: [fadeAnimation, delayedFadeAnimation],
})
export class CreateOrJoinRoomComponent implements OnInit, OnDestroy {
  name = new FormControl('');
  roomId = new FormControl('');
  joinAs = new FormControl(MemberType.ESTIMATOR);

  isBusy = new BehaviorSubject<boolean>(false);
  isLoadingUser = new BehaviorSubject<boolean>(true);
  onJoinRoomClicked = new Subject<void>();
  onCreateRoomClicked = new Subject<void>();
  onSignInClicked = new Subject<void>();

  destroy = new Subject<void>();

  user = combineLatest([this.authService.user, this.isBusy]).pipe(
    filter(([_, busy]) => !busy),
    tap(([user]) => {
      if (user && user.displayName) {
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

  pageMode: Observable<PageMode> = this.currentPath.pipe(
    map((path) => {
      return path === 'create' ? PageMode.CREATE : PageMode.JOIN;
    })
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
    }),
    tap(() => this.isLoadingUser.next(false))
  );

  readonly PageMode = PageMode;
  readonly MemberType = MemberType;

  constructor(
    private estimatorService: EstimatorService,
    private router: Router,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly zoomService: ZoomApiService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();

    const sessionCookie = this.authService.getSessionCookie();
    if (
      this.config.isRunningInZoom &&
      sessionCookie &&
      typeof sessionCookie !== 'string'
    ) {
      this.dialog.open(
        ...authProgressDialogCreator({
          initialState: AuthProgressState.IN_PROGRESS,
          startAccountSetupOnOpen: true,
        })
      );
    }

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

    this.onSignInClicked
      .pipe(
        switchMap(async () => {
          if (this.config.isRunningInZoom) {
            return this.signInWithGoogleInZoom();
          }
          return from(this.authService.signInWithGoogle());
        }),
        withLatestFrom(this.currentPath),
        tap(([_, currentPath]) => {
          this.analytics.logClickedSignIn(
            currentPath === 'create' ? 'create' : 'join'
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async signInWithGoogleInZoom() {
    this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: false,
      })
    );
    await this.zoomService.configureApp();
    await this.zoomService.openUrl(
      `${window.origin}/api/startGoogleAuth?intent=signIn`
    );
    return Promise.resolve();
  }

  async joinRoom() {
    const member: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    try {
      this.snackBar.dismiss();
      await this.estimatorService.joinRoom(this.roomId.value, member);

      const isObserver = this.joinAs.value === MemberType.OBSERVER;
      if (isObserver) {
        this.analytics.logClickedJoinAsObserver();
      } else {
        this.analytics.logClickedJoinedRoom();
      }

      return this.router.navigate(['room', this.roomId.value]);
    } catch (e) {
      this.showUnableToJoinRoom();
    }
  }

  showUnableToJoinRoom() {
    this.snackBar.open(
      'Unable to join room. Please check the ID and try again.',
      null,
      { duration: 3000, horizontalPosition: 'right' }
    );
  }

  signOut() {
    return this.authService.signOut();
  }

  async createRoom() {
    const newMember: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    const { room } = await this.estimatorService.createRoom(newMember);

    this.analytics.logClickedCreateNewRoom();
    return this.router.navigate(['room', room.roomId]);
  }

  onNameBlur() {
    this.analytics.logFilledNameInput();
  }

  onRoomIdBlur() {
    this.analytics.logFilledRoomId();
  }
}
