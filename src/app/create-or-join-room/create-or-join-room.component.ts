import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { EstimatorService } from '../services/estimator.service';
import { Router, ActivatedRoute, RouterModule, Params } from '@angular/router';
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
  firstValueFrom,
  from,
  interval,
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
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { User } from '@angular/fire/auth';
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
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { roomAuthenticationModalCreator } from '../shared/room-authentication-modal/room-authentication-modal.component';
import { OrganizationService } from '../services/organization.service';
import { avatarModalCreator } from '../shared/avatar-selector-modal/avatar-selector-modal.component';
import { RecurringMeetingLinkService } from '../services/recurring-meeting-link.service';
import { ConfigService } from '../services/config.service';
import { TeamsService } from '../services/teams.service';
import { NavigationService } from '../services/navigation.service';
import { CarbonAdComponent } from '../shared/carbon-ad/carbon-ad.component';
import { pricingModalCreator } from '../shared/pricing-table/pricing-table.component';
import { ToastService } from '../services/toast.service';
import { MeetApiService } from '../services/meet-api.service';
import { ProfileDropdownComponent } from '../shared/profile-dropdown/profile-dropdown.component';
import { MatIcon } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResizeMonitorDirective } from '../shared/directives/resize-monitor.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { outOfCreditsOfferModalCreator } from '../shared/out-of-credits-offer-modal/out-of-credits-offer-modal.component';

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

const LOADING_MESSAGES = [
  'Waking up the servers... 😴',
  'Checking your credits... 🪙',
  'Generating a great room name... 💭',
  'Packing it all up... 📦',
  'Redirecting to your room... 🔜',
];

@Component({
  imports: [
    CommonModule,
    RouterModule,
    ZoomAppBannerComponent,
    AppConfigModule,
    CarbonAdComponent,
    ProfileDropdownComponent,
    MatIcon,
    MatCardModule,
    MatOptionModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    ResizeMonitorDirective,
    MatTooltipModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
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
    map(paramMap => paramMap.get('roomId')),
    tap(roomId => {
      if (roomId) {
        this.roomId.setValue(roomId);
        this.analytics.logAutoFilledRoomId();
      }
    }),
    shareReplay(1)
  );

  flowFromParams$: Observable<string> = this.activatedRoute.queryParamMap.pipe(
    map(paramMap => paramMap.get('flow'))
  );

  recurringMeetingId$: Observable<string | null> =
    this.activatedRoute.queryParamMap.pipe(
      map(paramMap => paramMap.get('recurringMeetingId'))
    );

  recurringMeeting$: Observable<RecurringMeetingLink | undefined> =
    this.recurringMeetingId$.pipe(
      switchMap(id => {
        return id
          ? this.recurringMeetingService.getRecurringMeeting(id)
          : of(undefined);
      })
    );

  currentPath: Observable<string> = this.activatedRoute.url.pipe(
    map(segments => [...segments]?.pop()?.path)
  );

  pageMode: Observable<PageMode> = this.currentPath.pipe(
    map(path => {
      return path === 'create' ? PageMode.CREATE : PageMode.JOIN;
    })
  );

  recentlyLeftRoom$ = this.authService.getUserPreference().pipe(
    take(1),
    filter(preference => !!preference?.lastJoinedRoom),
    map(preference => preference.lastJoinedRoom),
    filter(
      lastJoinedRoom =>
        (lastJoinedRoom.heartbeatAt as any).seconds * 1000 >
        Date.now() - 1000 * 60 * 5 // 5 minutes
    ),
    shareReplay(1)
  );

  shouldAutoNavigateToRecentRoomInTeams$ = this.recentlyLeftRoom$.pipe(
    filter(
      room =>
        this.config.runningIn === 'teams' &&
        (room.heartbeatAt as any).seconds * 1000 > Date.now() - 1000 * 60 * 2 && // 2 minutes
        !this.hideRecentlyLeftRoom
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
    tap(() => this.isLoadingUser.next(false)),
    shareReplay(1)
  );

  organization: Observable<Organization | undefined> = this.user.pipe(
    switchMap(user => {
      if (!user?.isAnonymous) {
        return this.organizationService.getMyOrganization().pipe(first());
      } else {
        return of(undefined);
      }
    })
  );

  loadingMessage = interval(2000).pipe(
    startWith(-1),
    map((_val, index) => {
      const message =
        LOADING_MESSAGES[Math.min(index, LOADING_MESSAGES.length - 1)];
      return message;
    })
  );

  isServer = typeof window === 'undefined';

  readonly PageMode = PageMode;
  readonly MemberType = MemberType;

  // Feature highlights for unauthenticated users
  readonly features = [
    {
      icon: 'groups',
      title: 'Real-time Collaboration',
      description: 'See votes instantly as your team estimates together.',
    },
    {
      icon: 'integration_instructions',
      title: 'Jira & Linear Integration',
      description: 'Import issues directly from your project management tools.',
    },
    {
      icon: 'style',
      title: 'Custom Card Decks',
      description: 'Fibonacci, T-shirt sizes, or create your own card set.',
    },
    {
      icon: 'video_call',
      title: 'Video Conferencing Integration',
      description: 'Use directly in Zoom, Teams, Meet, or Webex.',
    },
  ];

  // Recent sessions for authenticated users (limit to 3 to minimize database calls)
  recentSessions$: Observable<{ roomId: string; createdAt: Date; roundCount: number }[]> =
    this.user.pipe(
      switchMap(user => {
        if (!user || user.isAnonymous) return of([]);
        return this.estimatorService.getPreviousSessions(3).pipe(
          map(rooms =>
            rooms.map(room => ({
              roomId: room.roomId,
              createdAt: (room.createdAt as any)?.toDate?.() || new Date(),
              roundCount: Object.keys(room.rounds || {}).length,
            }))
          ),
          catchError(() => of([]))
        );
      }),
      shareReplay(1)
    );

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
    private readonly meetService: MeetApiService,
    private readonly navigationService: NavigationService,
    private readonly toastService: ToastService,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

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
        if (
          roomId &&
          this.activatedRoute.snapshot.fragment === 'follow-deep-link'
        ) {
          this.router.navigate(['join'], { queryParams: { roomId } });
        }
      });
    }

    if (this.config.runningIn === 'meet') {
      this.configService.setSessionCookie('runningInMeet', '1');
      this.meetService.configureApp();
    }

    this.onJoinRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() =>
          from(this.joinRoom()).pipe(
            catchError(e => {
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
                  switchMap(result => {
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
      .subscribe(success => {
        if (success) {
          this.navigateToRoom(this.roomId.value);
        }
      });

    this.onCreateRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() => this.recurringMeetingId$),
        switchMap(recurringMeetingId =>
          from(this.createRoom(recurringMeetingId)).pipe(
            catchError(e => {
              if (e.details === 'error-no-credits') {
                this.dialog.open(
                  ...outOfCreditsOfferModalCreator('out-of-credits')
                );
              } else {
                throw e;
              }
              this.isBusy.next(false);
              return of({});
            })
          )
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
      .subscribe(async flowParam => {
        if (flowParam === 'premium') {
          this.dialog.open(...pricingModalCreator());
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

    this.shouldAutoNavigateToRecentRoomInTeams$
      .pipe(takeUntil(this.destroy))
      .subscribe(room => {
        this.navigateToRoom(room.roomId);
        this.snackBar.open(
          "You've been automatically redirected to your last room in Teams",
          undefined,
          { duration: 5000, horizontalPosition: 'right' }
        );
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

  navigateToRoom(roomId: string, queryParams?: Params) {
    this.router.navigate(['room', roomId], { queryParams });
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

    try {
      const userPreference = await firstValueFrom(
        this.authService.getUserPreference()
      );

      if (userPreference?.defaultRoomTemplateId) {
        const template = await firstValueFrom(
          this.authService
            .getRoomTemplates()
            .pipe(
              map(templates =>
                templates.find(
                  t => t.slotId === userPreference.defaultRoomTemplateId
                )
              )
            )
        );

        if (template) {
          await this.estimatorService.applyTemplate(room, template);
        }
      }
    } catch (error) {
      console.error(error);
    }

    this.analytics.logClickedCreateNewRoom();
    return this.navigateToRoom(room.roomId);
  }

  onNameBlur() {
    this.analytics.logFilledNameInput();
  }

  onRoomIdBlur() {
    this.analytics.logFilledRoomId();
  }

  clearRoomIdParam() {
    this.router.navigate([], {
      queryParams: { roomId: null },
    });
  }
}
