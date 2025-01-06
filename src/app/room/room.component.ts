import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { EstimatorService } from '../services/estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  first,
  from,
  interval,
  map,
  merge,
  Observable,
  of as observableOf,
  of,
  pairwise,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap,
  timeInterval,
  withLatestFrom,
} from 'rxjs';
import {
  CardSet,
  CARD_SETS,
  Member,
  MemberStatus,
  MemberType,
  RichTopic,
  Room,
  RoomPermissionId,
  Round,
  RoundStatistics,
  UserProfileMap,
  CardSetValue,
} from '../types';
import { MatDialog } from '@angular/material/dialog';
import { AloneInRoomModalComponent } from './alone-in-room-modal/alone-in-room-modal.component';
import { AnalyticsService } from '../services/analytics.service';
import {
  createTimer,
  getHumanReadableElapsedTime,
  getSortedCardSetValues,
} from '../utils';
import { getRoomCardSetValue } from '../pipes/estimate-converter.pipe';
import {
  MatSidenavContainer,
  MatSidenavContent,
  MatSidenav,
} from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';
import { avatarModalCreator } from '../shared/avatar-selector-modal/avatar-selector-modal.component';
import { AppConfig, APP_CONFIG } from '../app-config.module';
import { ZoomApiService } from '../services/zoom-api.service';
import { StarRatingComponent } from '../shared/star-rating/star-rating.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { PermissionsService } from '../services/permissions.service';
import { isEqual } from 'lodash-es';
import {
  TopicEditorInputOutput,
  TopicEditorComponent,
} from './topic-editor/topic-editor.component';
import { WebexApiService } from '../services/webex-api.service';
import { delayedFadeAnimation, fadeAnimation } from '../shared/animations';
import { TeamsService } from '../services/teams.service';
import { PaymentService } from '../services/payment.service';
import { Timestamp } from '@angular/fire/firestore';
import { ToastService } from '../services/toast.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ThemeService } from '../services/theme.service';
import { RoomDataService } from './room-data.service';
import { introducingNewPricingModalCreator } from '../shared/introducing-new-pricing-modal/introducing-new-pricing-modal.component';
import { pricingModalCreator } from '../shared/pricing-table/pricing-table.component';
import { MeetApiService } from '../services/meet-api.service';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { RoomControllerPanelComponent } from './room-controller-panel/room-controller-panel.component';
import { AnonymousUserBannerComponent } from '../shared/anonymous-user-banner/anonymous-user-banner.component';
import { TopicsSidebarComponent } from './topics-sidebar/topics-sidebar.component';
import { CarbonAdComponent } from '../shared/carbon-ad/carbon-ad.component';
import { ReactionsRendererComponent } from './reactions-renderer/reactions-renderer.component';
import { GithubBadgeComponent } from './github-badge/github-badge.component';
import { CardDeckComponent } from './card-deck/card-deck.component';
import { NotesFieldComponent } from './notes-field/notes-field.component';
import { RoundResultsComponent } from './round-results/round-results.component';
import { NgTemplateOutlet, AsyncPipe } from '@angular/common';
import { RichTopicComponent } from './rich-topic/rich-topic.component';
import { ResizeMonitorDirective } from '../shared/directives/resize-monitor.directive';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatButton } from '@angular/material/button';
import { ProfileDropdownComponent } from '../shared/profile-dropdown/profile-dropdown.component';
import { ShepherdService } from 'angular-shepherd';

const ALONE_IN_ROOM_MODAL = 'alone-in-room';
const ROOM_SIZE_LIMIT = 100;
const TOPIC_ANIMATION_SLIDE_DURATION_MS = 200;
const CHARTING_COLORS = [
  '#1c4182',
  '#475e9a',
  '#6c7db3',
  '#8f9ecc',
  '#b4bfe5',
  '#d9e2ff',
];
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    ProfileDropdownComponent,
    MatButton,
    MatTooltip,
    MatIcon,
    MatCard,
    ResizeMonitorDirective,
    MatCardContent,
    TopicEditorComponent,
    RichTopicComponent,
    NgTemplateOutlet,
    RoundResultsComponent,
    NotesFieldComponent,
    CardDeckComponent,
    GithubBadgeComponent,
    ReactionsRendererComponent,
    CarbonAdComponent,
    MatSidenav,
    TopicsSidebarComponent,
    AnonymousUserBannerComponent,
    RoomControllerPanelComponent,
    AsyncPipe,
  ],
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenavContainer, { read: ElementRef })
  sidenav: MatSidenavContainer;
  @ViewChild('sidenavContent', { read: ElementRef, static: true })
  sidenavContent: ElementRef;
  @ViewChild('roomControllerPanel')
  roomControllerPanel: RoomControllerPanelComponent;
  @ViewChild('profileDropdown') profileDropdown: ProfileDropdownComponent;

  destroy = new Subject<void>();

  room = signal<Room | undefined>(undefined);
  rounds = signal<Round[]>([]);
  protected readonly currentRound = signal<number | undefined>(undefined);
  protected readonly currentEstimate = signal<number | undefined>(undefined);

  estimationCardSets = signal<CardSetValue[]>(Object.values(CARD_SETS));
  selectedEstimationCardSetValue = signal<CardSetValue>(
    CARD_SETS[CardSet.DEFAULT]
  );
  estimationValues = signal<{ key: string; value: string }[]>(
    getSortedCardSetValues(this.selectedEstimationCardSetValue())
  );

  isEditingTopic = signal<boolean>(false);
  isObserver = signal<boolean>(false);
  isMuted = signal<boolean>(true);
  shouldShowAloneInRoom = false;
  isAloneInRoomHidden = false;
  roundStatistics = signal<RoundStatistics[]>([]);
  isControlPaneExpanded = signal<boolean>(true);
  isControlPaneExpansionSetByUser = false;
  isSmallScreen$ = this.breakpointObserver.observe('(max-width: 800px)');

  room$: Observable<Room> = this.roomDataService.room$.pipe(
    takeUntil(this.destroy)
  );

  roomTopic$: Observable<{ topic: string; richTopic?: RichTopic | null }> =
    this.roomDataService.roomTopic$.pipe(takeUntil(this.destroy));

  members$: Observable<Member[]> = this.roomDataService.activeMembers$.pipe(
    takeUntil(this.destroy)
  );

  activeMember$: Observable<Member> = this.roomDataService.activeMember$.pipe(
    takeUntil(this.destroy)
  );

  roundNumber$: Observable<number> =
    this.roomDataService.currentRoundNumber$.pipe(takeUntil(this.destroy));

  topicWithAnimation$: Observable<{
    animationClass: string;
    topicName: string;
  }> = combineLatest([
    this.room$,
    this.roomDataService.currentRoundNumber$,
  ]).pipe(
    startWith([undefined, undefined]),
    map(([room, roundNumber]) => ({
      roundNumber,
      topicName: room?.rounds?.[roundNumber]?.topic,
    })),
    distinctUntilChanged(isEqual),
    pairwise(),
    timeInterval(),
    switchMap(({ value: [previous, current], interval }) => {
      /** No animation if:
       * - the current round is not pairwise: initial load
       * - the round number did not change, only the topic: topic edited
       * - the emission happened during an ongoing animation: reduce flickering
       */
      if (
        previous.roundNumber === undefined ||
        previous.roundNumber === current.roundNumber ||
        interval < 2 * TOPIC_ANIMATION_SLIDE_DURATION_MS
      ) {
        return of({ animationClass: 'initial', topicName: current.topicName });
      }
      return merge(
        of(
          current.roundNumber > previous.roundNumber
            ? {
                animationClass: 'round-increase',
                topicName: previous.topicName,
              }
            : {
                animationClass: 'round-decrease',
                topicName: previous.topicName,
              }
        ),
        of({
          animationClass:
            current.roundNumber > previous.roundNumber
              ? 'appear-below'
              : 'appear-above',
          topicName: current.topicName,
        }).pipe(delay(TOPIC_ANIMATION_SLIDE_DURATION_MS)),
        of({ animationClass: 'initial', topicName: current.topicName }).pipe(
          delay(2 * TOPIC_ANIMATION_SLIDE_DURATION_MS)
        )
      );
    })
  );

  private previousSessions$ = this.estimatorService
    .getPreviousSessions()
    .pipe(first(), share(), takeUntil(this.destroy));

  sessionCount$ = this.previousSessions$.pipe(
    map((sessions) => sessions.length),
    share(),
    takeUntil(this.destroy)
  );

  userPreferences$ = this.authService.getUserPreference().pipe(share());
  userProfiles$: Observable<UserProfileMap> =
    this.roomDataService.userProfiles$.pipe(takeUntil(this.destroy));

  user$ = this.authService.user;

  showFeedbackForm$ = combineLatest([
    this.roundNumber$,
    this.sessionCount$,
    this.userPreferences$.pipe(first()),
  ]).pipe(
    distinctUntilChanged(isEqual),
    map(([roundNumber, sessionCount, userPreferences]) => {
      return (
        sessionCount > 1 &&
        roundNumber > 1 &&
        (!userPreferences?.feedbackFormLastShown ||
          (userPreferences.feedbackFormLastShown as any).seconds * 1000 <
            Date.now() - 1000 * 60 * 60 * 24 * 30)
      );
    }),
    takeUntil(this.destroy)
  );

  controlPanelExpandedDefaultState$: Observable<boolean> = combineLatest([
    this.isSmallScreen$,
    this.room$,
    this.user$,
  ]).pipe(
    first(),
    map(([isSmallScreen, room, user]) => {
      const isCreator = room.createdById === user.uid;
      return !isSmallScreen.matches || (isSmallScreen.matches && isCreator);
    })
  );

  shouldOpenAloneInRoomModal$: Observable<boolean> = combineLatest([
    this.roundNumber$,
    this.sessionCount$,
    this.userPreferences$.pipe(first()),
  ]).pipe(
    map(([roundNumber, sessionCount, pref]) => {
      return roundNumber > 0 && sessionCount < 2 && !pref.aloneInRoomModalShown;
    }),
    filter((shouldOpen) => !!shouldOpen)
  );

  shouldStartOnboardingTutorial$: Observable<{
    shouldOpen: boolean;
    small: boolean;
  }> = combineLatest([
    this.previousSessions$,
    this.user$,
    this.userPreferences$.pipe(first()),
    this.isSmallScreen$,
  ]).pipe(
    map(([previousSessions, user, pref, isSmallScreen]) => {
      return {
        shouldOpen:
          previousSessions.length === 1 &&
          previousSessions[0].createdById === user.uid &&
          !pref.onboardingTutorialShown,
        small: isSmallScreen.matches,
      };
    }),
    filter(({ shouldOpen }) => !!shouldOpen),
    take(1)
  );

  shouldOpenExistingUserPricingModal$: Observable<boolean> = combineLatest([
    this.user$,
    this.userPreferences$.pipe(first()),
  ]).pipe(
    filter(([user, pref]) => {
      const releaseDate = new Date('2023-12-11');
      return (
        user &&
        releaseDate.getTime() >
          new Date(user.metadata.creationTime).getTime() &&
        !pref.updatedPricingModalShown
      );
    }),
    map(() => true),
    first()
  );

  heartbeat$: Observable<number> = interval(4 * 60 * 1000).pipe(startWith(-1));

  isRoomCreator$ = this.roomDataService.isRoomCreator$;

  availableCredits$ = from(
    this.paymentService.getAndAssignCreditBundles()
  ).pipe(
    map((response) => response.availableCredits),
    shareReplay(1)
  );

  creditsText$: Observable<string> = this.availableCredits$.pipe(
    map((credits) => {
      return credits.length === 0
        ? 'Out of credits'
        : credits.length === 1
        ? '1 credit left'
        : credits.length + ' credits';
    }),
    shareReplay(1)
  );

  creditsAlert$: Observable<number> = combineLatest([
    this.availableCredits$,
    this.permissionsService.hasPremiumAccess(),
  ]).pipe(
    filter(([credits, isPremium]) => credits.length <= 1 && !isPremium),
    map(([credits]) => credits.length),
    distinctUntilChanged()
  );

  readonly MemberType = MemberType;
  readonly observableOf = observableOf;

  openedFeedbackForm: boolean = false;
  inactiveTimeoutHandle: number;

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private zoomService: ZoomApiService,
    private readonly webexService: WebexApiService,
    private readonly teamsService: TeamsService,
    private readonly meetService: MeetApiService,
    public readonly permissionsService: PermissionsService,
    public readonly paymentService: PaymentService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly clipboard: Clipboard,
    private readonly toastService: ToastService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly themeService: ThemeService,
    private readonly roomDataService: RoomDataService,
    private readonly confirmDialogService: ConfirmDialogService,
    private readonly shepherdService: ShepherdService
  ) {}

  ngOnInit(): void {
    const roomIdFromParams = this.route.snapshot.paramMap.get('roomId');
    this.roomDataService.loadRoom(
      roomIdFromParams,
      this.route.snapshot.data.room
    );

    if (this.config.runningIn === 'zoom') {
      this.zoomService.configureApp();
    }
    if (this.config.runningIn === 'webex') {
      this.webexService.configureApp();
    }
    if (this.config.runningIn === 'teams') {
      this.teamsService.configureApp();
    }
    if (this.config.runningIn === 'meet') {
      this.meetService.configureApp(roomIdFromParams);
    }

    this.room$.pipe(takeUntil(this.destroy)).subscribe((room) => {
      this.room.set(room);
      this.rounds.set(Object.values(room.rounds));
    });

    this.activeMember$.subscribe((member) => {
      if (member?.status === MemberStatus.REMOVED_FROM_ROOM) {
        this.router.navigate(['join'], {
          queryParams: { reason: 'removed' },
        });
      } else if (member?.type === MemberType.OBSERVER) {
        this.joinAsObserver();
      }
    });

    this.roundNumber$.pipe(takeUntil(this.destroy)).subscribe((roundNumber) => {
      this.currentRound.set(roundNumber);
      this.playNotificationSound();
      this.reCalculateStatistics();
    });

    this.roomDataService.onEstimatesUpdated$
      .pipe(takeUntil(this.destroy))
      .subscribe((estimates) => {
        if (this.estimatorService.activeMember) {
          this.currentEstimate.set(
            estimates[this.estimatorService.activeMember.id]
          );
          this.reCalculateStatistics();
        }
      });

    this.roomDataService.onCardSetUpdated$
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.updateSelectedCardSets();
      });

    this.roomDataService.onNameUpdated$
      .pipe(takeUntil(this.destroy))
      .subscribe((name) =>
        this.estimatorService.updateCurrentUserMemberName(this.room(), name)
      );

    this.showFeedbackForm$.subscribe((shouldShow) => {
      if (shouldShow) {
        this.openFeedbackSnackbar();
      }
    });

    this.roomDataService.onPermissionsUpdated$
      .pipe(takeUntil(this.destroy))
      .subscribe(([_permissions, room]) => {
        this.permissionsService.initializePermissions(
          room,
          this.estimatorService.activeMember.id
        );
      });

    this.controlPanelExpandedDefaultState$
      .pipe(takeUntil(this.destroy))
      .subscribe((shouldExapnd) => {
        if (this.isControlPaneExpansionSetByUser) return;
        this.isControlPaneExpanded.set(shouldExapnd);
      });

    this.shouldOpenAloneInRoomModal$
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.showOrHideAloneInRoomModal();
        this.authService
          .updateUserPreference({ aloneInRoomModalShown: true })
          .subscribe();
      });

    this.authService.avatarUpdated
      .pipe(
        distinctUntilChanged(),
        tap((photoURL: string) => {
          this.estimatorService.updateCurrentUserMemberAvatar(
            this.room(),
            photoURL
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();

    createTimer(2)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.showAvatarPrompt();
      });

    this.heartbeat$
      .pipe(
        switchMap(() =>
          this.room()
            ? combineLatest([
                this.saveJoinedRoom(),
                this.estimatorService.updateCurrentUserMemberHeartbeat(
                  this.room().roomId
                ),
              ])
            : of(undefined)
        ),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.shouldOpenExistingUserPricingModal$
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.dialog.open(...introducingNewPricingModalCreator());
        this.authService
          .updateUserPreference({
            updatedPricingModalShown: true,
          })
          .subscribe();
      });

    this.creditsAlert$
      .pipe(withLatestFrom(this.user$), takeUntil(this.destroy))
      .subscribe(([credits, user]) => {
        let message = '';
        const creditMessage = user.isAnonymous
          ? 'Get one free credit every month when you create a permanent account.'
          : 'Top up your credits or choose our unlimited subscription.';
        if (credits === 1) {
          message = 'You have just 1 credit remaining. ' + creditMessage;
        } else if (credits === 0) {
          message = 'You ran out of credits. ' + creditMessage;
        }

        const ref = this.toastService.showMessage(
          message,
          10000,
          'info',
          this.paymentService.isSubscriptionDisabled()
            ? undefined
            : 'Top up credits'
        );
        ref
          .onAction()
          .pipe(take(1))
          .subscribe(() => {
            this.dialog.open(...pricingModalCreator());
          });
      });

    this.roomDataService.onRoomRoundCountUpdated$
      .pipe(filter((count) => count >= ROOM_SIZE_LIMIT))
      .subscribe(() => {
        this.showRoomLimitReachedDialog();
      });
  }

  ngAfterViewInit() {
    this.themeService.themeValue.pipe(takeUntil(this.destroy)).subscribe(() => {
      const element = this.sidenavContent.nativeElement;
      element.style.animation = 'none';
      element.offsetHeight; /* trigger reflow */
      setTimeout(() => {
        element.style.animation = null;
      }, 10);
    });

    this.shouldStartOnboardingTutorial$.subscribe(({small}) => {
      this.startOnboarding(small);
    });
  }

  ngOnDestroy(): void {
    this.roomDataService.leaveRoom();
    clearTimeout(this.inactiveTimeoutHandle);
    this.destroy.next();
    this.destroy.complete();
  }

  toggleControlPane() {
    this.isControlPaneExpanded.set(!this.isControlPaneExpanded());
    this.isControlPaneExpansionSetByUser = true;
  }

  private saveJoinedRoom(): Observable<any> {
    return this.authService.updateUserPreference({
      lastJoinedRoom: {
        roomId: this.room().roomId,
        heartbeatAt: Timestamp.now(),
      },
    });
  }

  private updateSelectedCardSets() {
    this.selectedEstimationCardSetValue.set(getRoomCardSetValue(this.room()));
    this.estimationValues.set(
      getSortedCardSetValues(this.selectedEstimationCardSetValue())
    );

    if (
      this.selectedEstimationCardSetValue().key === 'CUSTOM' ||
      !!this.room().customCardSetValue
    ) {
      this.estimationCardSets.set([
        ...Object.values(CARD_SETS),
        this.room().customCardSetValue,
      ]);
    }
  }

  private joinAsObserver() {
    if (!this.isObserver()) {
      this.snackBar
        .open(
          'You are currently observing this estimation.',
          'Join as an Estimator',
          { duration: 10000, horizontalPosition: 'right' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['join'], {
            queryParams: { roomId: this.room().roomId },
          });
        });
    }
    this.isObserver.set(true);
  }

  private showOrHideAloneInRoomModal() {
    this.shouldShowAloneInRoom =
      this.room().members.length <= 1 &&
      (this.currentRound() > 0 || this.currentEstimate() !== undefined) &&
      !this.isAloneInRoomHidden;
    if (this.shouldShowAloneInRoom) {
      this.openAloneInRoomModal();
    } else {
      this.dialog.getDialogById(ALONE_IN_ROOM_MODAL)?.close();
    }
  }

  private openFeedbackSnackbar() {
    if (!this.openedFeedbackForm) {
      this.snackBar
        .openFromComponent(StarRatingComponent, {
          horizontalPosition: 'right',
          panelClass: 'feedback-panel',
        })
        .onAction()
        .pipe(takeUntil(this.destroy))
        .subscribe();

      this.openedFeedbackForm = true;
      this.authService
        .updateUserPreference({
          feedbackFormLastShown: Timestamp.now(),
        })
        .subscribe();
    }
  }

  private openAloneInRoomModal() {
    if (this.dialog.getDialogById(ALONE_IN_ROOM_MODAL) === undefined) {
      this.analytics.logShowedAloneInRoomModal();
      const dialogRef = this.dialog.open(AloneInRoomModalComponent, {
        id: ALONE_IN_ROOM_MODAL,
        height: '80%',
        maxHeight: '400px',
        width: '90%',
        maxWidth: '600px',
        disableClose: true,
        data: {
          name: this.estimatorService.activeMember?.name || 'Observer',
          onCopyLink: () => this.copyRoomId(),
        },
      });

      dialogRef.afterClosed().subscribe(() => {
        this.isAloneInRoomHidden = true;
      });
    }
  }

  private async showAvatarPrompt() {
    const user = await this.authService.getUser();
    if (!user?.photoURL) {
      this.snackBar.dismiss();
      this.snackBar
        .open(
          'Stand out from the crowd by adding your avatar 😎',
          'Set my avatar',
          { duration: 10000, horizontalPosition: 'right' }
        )
        .onAction()
        .subscribe(() => {
          this.dialog.open(
            ...avatarModalCreator({
              openAtTab: 'avatar',
            })
          );
          this.analytics.logClickedEditAvatar('snackbar');
        });
    }
  }

  playNotificationSound() {
    if (!this.isMuted()) {
      const audio = new Audio();
      audio.src = '../../assets/notification.mp3';
      audio.load();
      audio.play();
    }
  }

  async topicBlur(event: TopicEditorInputOutput) {
    this.isEditingTopic.set(false);
    await this.estimatorService.setTopic(
      this.room(),
      this.currentRound(),
      event.topic,
      event.richTopic
    );
  }

  onTopicClicked() {
    return this.permissionsService
      .hasPermission(RoomPermissionId.CAN_EDIT_TOPIC)
      .pipe(
        map((hasPermission) => {
          if (hasPermission) {
            this.analytics.logClickedTopicName();
            this.isEditingTopic.set(true);
          }
        }),
        first()
      )
      .subscribe();
  }

  reCalculateStatistics() {
    if (this.room()?.rounds) {
      const statistics: RoundStatistics[] = [
        ...Object.values(this.room().rounds).map((round) =>
          this.calculateRoundStatistics(round)
        ),
      ];
      this.roundStatistics.set(statistics);
    }
  }

  calculateRoundStatistics(round: Round) {
    const elapsed = getHumanReadableElapsedTime(round);
    const estimates = Object.keys(round.estimates)
      .filter((member) =>
        this.room()
          .members.map((m) => m.id)
          .includes(member)
      )
      .map((member) => ({
        value: round.estimates[member],
        voter: this.room().members.find((m) => m.id === member)?.name,
      }))
      .filter((e) => e.value !== null)
      .sort((a, b) => a.value - b.value);

    if (estimates.length) {
      const average =
        estimates
          .map((estimate) => estimate.value)
          .reduce((acc, curr) => acc + curr, 0) / estimates.length;
      const lowest = estimates[0];
      const highest = estimates[estimates.length - 1];

      const votesCount: { [estimateKey: string]: number } = estimates.reduce(
        (acc, curr) => {
          acc[curr.value] = acc[curr.value] ? acc[curr.value] + 1 : 1;
          return acc;
        },
        {}
      );

      // [estimateKey, numberOfVotes]
      const voteStatistics = Object.entries<number>(votesCount).sort(
        (a, b) => b[1] - a[1]
      );
      const mostPopularVoteEntry: [string, number] = voteStatistics[0];

      const pieChartData = voteStatistics.map(([key, value], index) => ({
        cardKey: +key,
        voteCount: value,
        percentage: Math.round((value / estimates.length) * 100),
        color: CHARTING_COLORS[Math.min(index, CHARTING_COLORS.length - 1)],
      }));

      return {
        average,
        elapsed,
        lowestVote: lowest,
        highestVote: highest,
        consensus: {
          value: +mostPopularVoteEntry[0],
          isConsensus: mostPopularVoteEntry[1] === estimates.length,
        },
        pieChartData,
      };
    }
  }

  toggleMute() {
    this.isMuted()
      ? this.analytics.logClickedEnableSound()
      : this.analytics.logClickedDisableSound();
    this.isMuted.set(!this.isMuted);
  }

  onCreateAccountClicked() {
    this.analytics.logClickedCreateAccount('room');
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }

  async copyRoomId() {
    this.analytics.logClickedShareRoom('main');
    let message = '';
    let duration = 3000;

    const host = window.origin || 'https://card-estimator.web.app';
    const roomUrl = `${host}/join?roomId=${this.room().roomId}`;
    if (this.config.runningIn === 'zoom') {
      try {
        const { invitationUUID } = await this.zoomService.inviteAllParticipants(
          this.room().roomId
        );
        await this.estimatorService.saveInvitation(
          invitationUUID,
          this.room().roomId
        );
        message = 'Invitation sent to all participants!';
      } catch {
        message = 'Please start a meeting first to invite others to join.';
      }
    } else if (this.config.runningIn === 'webex') {
      const shareSessionStarted = await this.webexService.inviteAllParticipants(
        this.room().roomId
      );
      message = shareSessionStarted
        ? 'All ready, click the "Open for all" button below! ⬇️'
        : 'Join link copied to clipboard for non-Webex participants.';
      if (!shareSessionStarted) {
        this.clipboard.copy(roomUrl);
      }
    } else if (this.config.runningIn === 'teams') {
      const canShareToStage = await this.teamsService.canShareToStage();

      let shareMethod: 'stage' | 'copy' = 'copy';
      let isSharingToStage = false;

      if (canShareToStage) {
        const shouldShareToStage =
          await this.confirmDialogService.openConfirmationDialog({
            title: 'Share to stage or copy link?',
            content:
              'You can either share the app to the meeting stage or copy the current room ID and send it to your colleagues yourself in chat. Which would you like to do?',
            positiveText: 'Share to Meeting Stage',
            negativeText: 'Copy room ID',
          });
        shareMethod = shouldShareToStage ? 'stage' : 'copy';
      }

      if (shareMethod === 'stage') {
        isSharingToStage = await this.teamsService.shareAppContentToStage(
          this.room().roomId
        );
      }

      if (isSharingToStage) {
        message =
          '🎉 Started sharing app to meeting stage for all meeting participants. You can close this side-panel.';
        duration = 10000;
        this.analytics.logSharedToStage();
      } else {
        message =
          'Join link copied, share it in the chat so others can join this room.';
      }
      const link = await this.teamsService.getDeepLink(this.room().roomId);

      this.clipboard.copy(link);
    } else if (this.config.runningIn === 'meet') {
      const success = await this.meetService.inviteAllParticipants(
        this.room().roomId
      );
      message = success
        ? 'Activity started, the app will open for everyone in the meeting. 🎉'
        : 'An activity is already ongoing.';
    } else {
      this.clipboard.copy(roomUrl);
      message = 'Join link copied to clipboard.';
    }

    this.toastService.showMessage(message, duration);
  }

  viewCredits() {
    this.dialog.open(...avatarModalCreator({ openAtTab: 'subscription' }));
  }

  async showRoomLimitReachedDialog() {
    const confirmed = await this.confirmDialogService.openConfirmationDialog({
      title: '🤯 Room size limit reached',
      content:
        "Looks like you've created a room bigger than our server's imagination. Please start a new session, unless you enjoy staring at this error message appear often.",
      disableClose: true,
      positiveText: 'Go to Create/Join page',
      negativeText: 'Close',
    });

    if (confirmed) {
      this.router.navigate(['/create']);
    }
  }

  private startOnboarding(isSmallScreen = true) {
    this.shepherdService.modal = true;
    this.shepherdService.defaultStepOptions = {
      classes: 'shepherd-theme-custom',
      scrollTo: { behavior: 'smooth' },
    };

    const nextAndBackButtons = [
      {
        text: 'Back',
        secondary: true,
        action: () => {
          this.shepherdService.back();
          this.analytics.logClickedBackOnboarding();
        },
      },
      {
        text: 'Next',
        action: () => {
          this.shepherdService.next();
          this.analytics.logClickedNextOnboarding();
        },
      },
    ];

    this.shepherdService.addSteps([
      {
        id: 'welcome',
        title: 'Greetings and Welcome to PlanningPoker.live 🎉',
        text: `<p>Get ready to streamline your estimation sessions! This brief guide will introduce you to the key features available in your virtual Planning Poker room.</p><p>If you're a Scrum Master, this tour will show you how to guide your team effectively. Let's get started!</p>`,
        buttons: [
          {
            text: 'No thanks',
            secondary: true,
            action: () => {
              this.shepherdService.cancel();
              this.analytics.logSkippedOnboarding();
              this.authService.updateUserPreference({ onboardingTutorialShown: true }).subscribe();
            },
          },
          {
            text: 'Next',
            action: () => {
              this.shepherdService.next();
              this.analytics.logStartedOnboarding();
              this.authService.updateUserPreference({ onboardingTutorialShown: true }).subscribe();
            },
          },
        ],
      },
      {
        id: 'topic-selector',
        title: 'Define Your Topic',
        text: `<p>Use this area to set the focal point for your team’s discussion—whether it's a story, bug, or task. You can easily edit the topic at any time or link it directly from Jira or Linear.</p><p>Clear topics help keep everyone on the same page throughout each round.</p>`,
        attachTo: {
          element: '.topic-container',
          on: 'bottom',
        },
        buttons: nextAndBackButtons,
      },
      {
        id: 'room-members',
        title: 'View Room Participants',
        text: `<p>Team members who join this room will appear here, ready to cast their estimates. Once everyone has voted, the results and statistics will also be displayed here.</p><p>There is also a built-in notes section—perfect for capturing key conversations and action points relevant to each topic.</p>`,
        attachTo: {
          element: '.members-card',
          on: isSmallScreen ? 'top' : 'right',
        },
        buttons: nextAndBackButtons,
      },
      {
        id: 'card-deck',
        title: 'Poker Card Deck',
        text: `<p>Here you can select your estimate by choosing a card that reflects the complexity or effort of the round's topic. Once all teammates have selected their cards, you can reveal everyone's estimates for transparent discussion.</p><p>You can even switch card sets later if you prefer a different estimation scale.</p>`,
        attachTo: {
          element: '.card-deck-container',
          on: 'top',
        },
        buttons: nextAndBackButtons,
      },
      {
        id: 'room-control',
        title: 'Manage the Room',
        text: `<p>Control your workflow from this panel—start a round, reveal results, invite team members, or set a timer to keep discussions focused. Keeping all controls in one area makes it easy to moderate sessions.</p><p>Use these features to ensure smooth estimation cycles.</p>`,
        attachTo: {
          element: '.estimate-container .big-panel',
          on: isSmallScreen ? 'top' : 'right',
        },
        buttons: nextAndBackButtons,
      },
      {
        id: 'more-options',
        attachTo: {
          element: '.mat-mdc-menu-panel',
          on: isSmallScreen ? 'top' : 'left',
        },
        title: 'Additional Configuration',
        text: `<p>Need more advanced settings? Access extra configuration options here, including different card sets, passwords, permissions, and a sidebar for managing rounds.</p><p>This section helps you tailor your experience to your team’s specific needs.</p>`,
        beforeShowPromise: () => {
          return new Promise((resolve) => {
            this.roomControllerPanel.openMenu();
            resolve(true);
          });
        },
        when: {
          hide: () => {
            this.roomControllerPanel.closeMenu();
          },
        },
        buttons: nextAndBackButtons,
      },
      {
        id: 'app-options',
        attachTo: {
          element: '.profile-menu',
          on: isSmallScreen ? 'top' : 'right',
        },
        title: 'Access Your Account & Settings',
        text: `<p>All other account management features are found here—update your avatar, check your past sessions, monitor credits, or manage your organization in one convenient menu.</p><p>These tools help maintain a smooth and organized Planning Poker experience for you and your team.</p>`,
        beforeShowPromise: () => {
          return new Promise((resolve) => {
            this.profileDropdown.openMenu();
            resolve(true);
          });
        },
        when: {
          hide: () => {
            this.profileDropdown.closeMenu();
          },
        },
        buttons: [
          {
            text: 'Finish',
            action: () => {
              this.profileDropdown.closeMenu();
              this.shepherdService.complete();
              this.analytics.logCompletedOnboarding();
            },
          },
        ],
      },
    ]);
    this.shepherdService.start();
  }
}
