import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  EstimatorService,
  RoomNotFoundError,
} from '../services/estimator.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Member,
  MemberType,
  MemberStatus,
  Organization,
  RecurringMeetingLink,
} from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';

import {
  BehaviorSubject,
  combineLatest,
  from,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  first,
  map,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { User } from 'firebase/auth';
import { AppConfig, AppConfigModule, APP_CONFIG } from '../app-config.module';
import {
  delayedFadeAnimation,
  fadeAnimation,
  slideInRightAnimation,
} from '../shared/animations';
import { MatDialog } from '@angular/material/dialog';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../shared/auth-progress-dialog/auth-progress-dialog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { roomAuthenticationModalCreator } from '../shared/room-authentication-modal/room-authentication-modal.component';
import { OrganizationService } from '../services/organization.service';
import { premiumLearnMoreModalCreator } from '../shared/premium-learn-more/premium-learn-more.component';
import { avatarModalCreator } from '../shared/avatar-selector-modal/avatar-selector-modal.component';
import { RecurringMeetingLinkService } from '../services/recurring-meeting-link.service';
import { ConfigService } from '../services/config.service';
import { TeamsService } from '../services/teams.service';
import { Timestamp } from 'firebase/firestore';
import { NavigationService } from '../services/navigation.service';
import { CarbonAdComponent } from '../shared/carbon-ad/carbon-ad.component';

enum PageMode {
  CREATE = 'create',
  JOIN = 'join',
}

interface ViewModel {
  user: User | undefined;
  roomId: string | undefined;
  mode: PageMode;
}

const LATE_NIGHT_GREETING = 'Burning the midnight oil, {name}?';
const EARLY_MORNING_GREETING = 'Rise and shine, {name}.';
const MORNING_GREETING = 'Good morning, {name}. Ready for some planning?';
const LUNCHTIME_GREETING = 'Planning before lunch, {name}?';
const AFTERNOON_GREETING = 'Good afternoon, {name}. Time for some planning?';
const EVENING_GREETING = 'Time for some evening planning, {name}.';

const GREETINGS: { [hour: number]: string } = {
  0: LATE_NIGHT_GREETING,
  1: LATE_NIGHT_GREETING,
  2: LATE_NIGHT_GREETING,
  3: LATE_NIGHT_GREETING,
  4: LATE_NIGHT_GREETING,
  5: EARLY_MORNING_GREETING,
  6: EARLY_MORNING_GREETING,
  7: EARLY_MORNING_GREETING,
  8: MORNING_GREETING,
  9: MORNING_GREETING,
  10: MORNING_GREETING,
  11: MORNING_GREETING,
  12: LUNCHTIME_GREETING,
  13: LUNCHTIME_GREETING,
  14: AFTERNOON_GREETING,
  15: AFTERNOON_GREETING,
  16: AFTERNOON_GREETING,
  17: AFTERNOON_GREETING,
  18: EVENING_GREETING,
  19: EVENING_GREETING,
  20: EVENING_GREETING,
  21: EVENING_GREETING,
  22: EVENING_GREETING,
  23: EVENING_GREETING,
};

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ZoomAppBannerComponent,
    AppConfigModule,
    CarbonAdComponent,
  ],
  selector: 'app-create-or-join-room',
  templateUrl: './create-or-join-room.component.html',
  styleUrls: ['./create-or-join-room.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation, slideInRightAnimation],
})
export class CreateOrJoinRoomComponent implements OnInit, OnDestroy {
  name = new FormControl<string>('');
  roomId = new FormControl<string>('');
  joinAs = new FormControl<MemberType>(MemberType.ESTIMATOR);

  isBusy = new BehaviorSubject<boolean>(false);
  isLoadingUser = new BehaviorSubject<boolean>(true);
  onJoinRoomClicked = new Subject<void>();
  onCreateRoomClicked = new Subject<void>();
  onSignInClicked = new Subject<void>();

  greeting = 'Welcome back!';

  destroy = new Subject<void>();

  user = combineLatest([this.authService.user, this.isBusy]).pipe(
    filter(([_, busy]) => !busy),
    tap(([user]) => {
      if (user && user.displayName) {
        this.name.setValue(user.displayName);
        this.greeting = GREETINGS[new Date().getHours()].replace(
          '{name}',
          user.displayName
        );
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

  flowFromParams$: Observable<string> = this.activatedRoute.queryParamMap.pipe(
    map((paramMap) => paramMap.get('flow'))
  );

  recurringMeetingId$: Observable<string | null> =
    this.activatedRoute.queryParamMap.pipe(
      map((paramMap) => paramMap.get('recurringMeetingId'))
    );

  recurringMeeting$: Observable<RecurringMeetingLink | undefined> =
    this.recurringMeetingId$.pipe(
      switchMap((id) => {
        return id
          ? this.recurringMeetingService.getRecurringMeeting(id)
          : of(undefined);
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

  recentlyLeftRoom$ = this.authService.getUserPreference().pipe(
    take(1),
    filter((preference) => !!preference?.lastJoinedRoom),
    map((preference) => preference.lastJoinedRoom),
    filter(
      (lastJoinedRoom) =>
        (lastJoinedRoom.heartbeatAt as any).seconds * 1000 >
        Date.now() - 1000 * 60 * 5
    )
  );

  hideRecentlyLeftRoom = this.navigationService.hasHistory();

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

  organization: Observable<Organization | undefined> = this.user.pipe(
    switchMap((user) => {
      if (!user?.isAnonymous) {
        return this.organizationService.getMyOrganization().pipe(first());
      } else {
        return of(undefined);
      }
    })
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
    private readonly dialog: MatDialog,
    private readonly organizationService: OrganizationService,
    private readonly recurringMeetingService: RecurringMeetingLinkService,
    private readonly configService: ConfigService,
    private readonly teamsService: TeamsService,
    private readonly navigationService: NavigationService,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();

    const sessionCookie = this.authService.getSessionCookie();
    if (
      this.config.runningIn === 'zoom' &&
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

    if (this.config.runningIn === 'webex') {
      this.configService.setSessionCookie('runningInWebex', '1');
    }

    if (this.config.runningIn === 'teams') {
      this.configService.setSessionCookie('runningInTeams', '1');
      this.teamsService.configureApp().then(async () => {
        const roomId = await this.teamsService.getLinkedRoomId();
        if (roomId) {
          this.router.navigate(['join'], { queryParams: { roomId } });
        }
      });
    }

    this.onJoinRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() =>
          from(this.joinRoom()).pipe(
            catchError((e) => {
              if (e.code !== 'permission-denied') {
                this.showUnableToJoinRoom();
                return of(false);
              } else {
                const dialogRef = this.dialog.open(
                  ...roomAuthenticationModalCreator({
                    roomId: this.roomId.value,
                  })
                );
                return dialogRef.afterClosed().pipe(
                  first(),
                  switchMap((result) => {
                    if (result !== '' && result?.joined) {
                      return from(this.joinRoom());
                    } else {
                      return of(false);
                    }
                  })
                );
              }
            })
          )
        ),
        tap(() => this.isBusy.next(false)),
        takeUntil(this.destroy)
      )
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['room', this.roomId.value]);
        }
      });

    this.onCreateRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() => this.recurringMeetingId$),
        switchMap((recurringMeetingId) =>
          from(this.createRoom(recurringMeetingId))
        ),
        takeUntil(this.destroy),
        finalize(() => this.isBusy.next(false))
      )
      .subscribe();

    this.onSignInClicked
      .pipe(
        tap(() => {
          this.dialog.open(
            ...signUpOrLoginDialogCreator({
              intent: SignUpOrLoginIntent.SIGN_IN,
            })
          );
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

    this.flowFromParams$
      .pipe(takeUntil(this.destroy))
      .subscribe(async (flowParam) => {
        if (flowParam === 'premium') {
          this.dialog.open(...premiumLearnMoreModalCreator());
        } else if (flowParam === 'manageSubscription') {
          const user = await this.authService.getUser();
          if (user) {
            this.dialog.open(
              ...avatarModalCreator({ openAtTab: 'subscription' })
            );
          } else {
            this.dialog.open(
              ...signUpOrLoginDialogCreator({
                intent: SignUpOrLoginIntent.SIGN_IN,
              })
            );
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async joinRoom(): Promise<boolean> {
    const member: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    this.snackBar.dismiss();
    await this.estimatorService.joinRoom(this.roomId.value, member);

    const isObserver = this.joinAs.value === MemberType.OBSERVER;
    if (isObserver) {
      this.analytics.logClickedJoinAsObserver();
    } else {
      this.analytics.logClickedJoinedRoom();
    }

    return true;
  }

  rejoinRoom(roomId: string) {
    this.router.navigate(['room', roomId]);
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

  async createRoom(recurringMeetingId: string | null) {
    const newMember: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    const { room } = await this.estimatorService.createRoom(
      newMember,
      recurringMeetingId
    );

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
