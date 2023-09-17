import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  Inject,
} from '@angular/core';
import {
  EstimatorService,
  NotLoggedInError,
} from '../services/estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  filter,
  first,
  interval,
  map,
  Observable,
  of as observableOf,
  share,
  shareReplay,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import {
  CardSet,
  CardSetValue,
  CARD_SETS,
  DEFAULT_ROOM_CONFIGURATION,
  Member,
  MemberStatus,
  MemberType,
  RichTopic,
  Room,
  RoomPermissionId,
  Round,
  RoundStatistics,
  UserProfileMap,
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
import { MatSidenavContainer } from '@angular/material/sidenav';
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
import { roomAuthenticationModalCreator } from '../shared/room-authentication-modal/room-authentication-modal.component';
import { TopicEditorInputOutput } from './topic-editor/topic-editor.component';
import { WebexApiService } from '../services/webex-api.service';
import {
  delayedFadeAnimation,
  fadeAnimation,
  bounceAnimation,
} from '../shared/animations';
import { premiumLearnMoreModalCreator } from '../shared/premium-learn-more/premium-learn-more.component';
import { TeamsService } from '../services/teams.service';
import { PaymentService } from '../services/payment.service';
import { Timestamp } from '@angular/fire/firestore';
import { ToastService } from '../services/toast.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ThemeService } from '../services/theme.service';

const ALONE_IN_ROOM_MODAL = 'alone-in-room';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation, bounceAnimation],
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild(MatSidenavContainer, { read: ElementRef })
  sidenav: MatSidenavContainer;
  @ViewChild('sidenavContent', { read: ElementRef, static: true })
  sidenavContent: ElementRef;

  destroy = new Subject<void>();

  room: Room;
  rounds: Round[] = [];
  currentRound = undefined;
  currentEstimate: number;

  estimationCardSets = Object.values(CARD_SETS);
  selectedEstimationCardSetValue = CARD_SETS[CardSet.DEFAULT];
  estimationValues = getSortedCardSetValues(
    this.selectedEstimationCardSetValue
  );

  isEditingTopic = false;
  isObserver = false;
  isMuted = true;
  shouldShowAloneInRoom = false;
  isAloneInRoomHidden = false;
  roundStatistics: RoundStatistics[] = [];
  isControlPaneExpanded = true;
  isControlPaneExpansionSetByUser = false;
  isSmallScreen$ = this.breakpointObserver.observe('(max-width: 800px)');

  room$: Observable<Room> = this.route.paramMap.pipe(
    map((params) => params.get('roomId')),
    switchMap((roomId) =>
      this.estimatorService
        .getRoomById(roomId)
        .pipe(startWith(this.route.snapshot.data.room))
    ),
    filter((room) => !!room),
    catchError((e) => this.onRoomUpdateError(e)),
    shareReplay(1),
    takeUntil(this.destroy)
  );

  roomTopic$: Observable<{ topic: string; richTopic?: RichTopic | null }> =
    this.room$.pipe(
      map((room) => {
        return {
          topic: room?.rounds[room.currentRound ?? 0]?.topic || '',
          richTopic: room?.rounds[room.currentRound ?? 0]?.richTopic,
        };
      }),
      distinctUntilChanged(isEqual),
      takeUntil(this.destroy)
    );

  members$: Observable<Member[]> = this.room$.pipe(
    map((room) => [room.members, room.memberIds]),
    distinctUntilChanged<[Member[], string[]]>(isEqual),
    map(([members, memberIds]) =>
      members
        .filter(
          (m) =>
            (m.status === MemberStatus.ACTIVE || m.status === undefined) &&
            memberIds.includes(m.id)
        )
        .sort((a, b) => a.type?.localeCompare(b.type))
    ),
    shareReplay(1),
    takeUntil(this.destroy)
  );

  onRoomUpdated$ = this.room$.pipe(
    tap((room) => {
      this.onRoomUpdated(room);
    }),
    takeUntil(this.destroy)
  );

  activeMember$: Observable<Member> = combineLatest([
    this.room$,
    this.authService.user,
  ]).pipe(
    filter(([_room, user]) => !!user),
    map(([room, user]) => room.members.find((m) => m.id === user.uid)),
    distinctUntilChanged(isEqual),
    takeUntil(this.destroy)
  );

  onRoundNumberUpdated$: Observable<number> = this.room$.pipe(
    map((room) => room.currentRound),
    distinctUntilChanged(),
    tap((roundNumber) => {
      this.currentRound = roundNumber;
      this.playNotificationSound();
      this.showOrHideAloneInRoomModal();
      this.reCalculateStatistics();
    }),
    takeUntil(this.destroy)
  );

  onEstimatesUpdated$ = this.room$.pipe(
    map((room) => {
      const currentRound = room.rounds[room.currentRound ?? 0];
      return currentRound.estimates;
    }),
    distinctUntilChanged(isEqual),
    tap((estimates) => {
      if (this.estimatorService.activeMember) {
        this.currentEstimate = estimates[this.estimatorService.activeMember.id];
        this.reCalculateStatistics();
      }
    }),
    takeUntil(this.destroy)
  );

  onCardSetUpdated$: Observable<
    [CardSet | 'CUSTOM', CardSetValue | undefined]
  > = this.room$.pipe(
    map((room) => [room.cardSet, room.customCardSetValue]),
    distinctUntilChanged<[CardSet, CardSetValue]>(isEqual),
    tap(() => this.updateSelectedCardSets()),
    takeUntil(this.destroy)
  );

  onNameUpdated$: Observable<string> = this.authService.nameUpdated.pipe(
    distinctUntilChanged(),
    tap((photoURL: string) => {
      this.estimatorService.updateCurrentUserMemberName(this.room, photoURL);
    }),
    takeUntil(this.destroy)
  );

  onPermissionsUpdated$ = this.room$.pipe(
    map((room) => {
      return {
        permissions:
          room.configuration?.permissions ||
          DEFAULT_ROOM_CONFIGURATION.permissions,
        room,
      };
    }),
    distinctUntilChanged(isEqual),
    tap(({ room }) => {
      this.permissionsService.initializePermissions(
        room,
        this.estimatorService.activeMember.id
      );
    }),
    takeUntil(this.destroy)
  );

  sessionCount$ = this.estimatorService.getPreviousSessions().pipe(
    first(),
    map((sessions) => sessions.length),
    share(),
    takeUntil(this.destroy)
  );

  userPreferences$ = this.authService.getUserPreference().pipe(share());

  showFeedbackForm$ = combineLatest([
    this.onRoundNumberUpdated$,
    this.sessionCount$,
    this.userPreferences$,
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

  userProfiles$: Observable<UserProfileMap> = this.members$.pipe(
    distinctUntilChanged(isEqual),
    switchMap((members) =>
      this.authService.getUserProfiles(members?.map((m) => m.id) ?? [])
    ),
    shareReplay(1),
    takeUntil(this.destroy)
  );

  user$ = this.authService.user;

  heartbeat$: Observable<number> = interval(90000).pipe(startWith(-1));

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
    public readonly permissionsService: PermissionsService,
    public readonly paymentService: PaymentService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly clipboard: Clipboard,
    private readonly toastService: ToastService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly themeService: ThemeService
  ) {}

  ngOnInit(): void {
    if (this.config.runningIn === 'zoom') {
      this.zoomService.configureApp();
    }
    if (this.config.runningIn === 'webex') {
      this.webexService.configureApp();
    }
    if (this.config.runningIn === 'teams') {
      this.teamsService.configureApp();
    }

    this.room$.subscribe();
    this.onRoomUpdated$.subscribe();

    this.activeMember$.subscribe((member) => {
      if (member.status === MemberStatus.REMOVED_FROM_ROOM) {
        this.router.navigate(['join'], { queryParams: { reason: 'removed' } });
      } else if (member?.type === MemberType.OBSERVER) {
        this.joinAsObserver();
      }
    });

    this.onRoundNumberUpdated$.subscribe();
    this.onEstimatesUpdated$.subscribe();
    this.onCardSetUpdated$.subscribe();
    this.onNameUpdated$.subscribe();
    this.showFeedbackForm$.subscribe((shouldShow) => {
      if (shouldShow) {
        this.openFeedbackSnackbar();
      }
    });
    this.onPermissionsUpdated$.subscribe();
    this.isSmallScreen$
      .pipe(takeUntil(this.destroy))
      .subscribe(({ matches }) => {
        if (this.isControlPaneExpansionSetByUser) return;
        this.isControlPaneExpanded = !matches;
      });

    this.authService.avatarUpdated
      .pipe(
        distinctUntilChanged(),
        tap((photoURL: string) => {
          this.estimatorService.updateCurrentUserMemberAvatar(
            this.room,
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
        switchMap(() => this.saveJoinedRoom()),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.themeService.themeChanged
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        const element = this.sidenavContent.nativeElement;
        element.style.animation = 'none';
        element.offsetHeight; /* trigger reflow */
        setTimeout(() => {
          element.style.animation = null;
        }, 10)
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.inactiveTimeoutHandle);
    this.destroy.next();
    this.destroy.complete();
  }

  toggleControlPane() {
    this.isControlPaneExpanded = !this.isControlPaneExpanded;
    this.isControlPaneExpansionSetByUser = true;
  }

  private saveJoinedRoom(): Observable<any> {
    return this.authService.updateUserPreference({
      lastJoinedRoom: {
        roomId: this.room.roomId,
        heartbeatAt: Timestamp.now(),
      },
    });
  }

  private onRoomUpdated(room: Room) {
    this.room = room;
    this.rounds = Object.values(room.rounds);
  }

  private updateSelectedCardSets() {
    this.selectedEstimationCardSetValue = getRoomCardSetValue(this.room);
    this.estimationValues = getSortedCardSetValues(
      this.selectedEstimationCardSetValue
    );

    if (
      this.selectedEstimationCardSetValue.key === 'CUSTOM' ||
      !!this.room.customCardSetValue
    ) {
      this.estimationCardSets = [
        ...Object.values(CARD_SETS),
        this.room.customCardSetValue,
      ];
    }
  }

  private onRoomUpdateError(error: any): Observable<any> {
    if (error?.code === 'permission-denied') {
      return this.dialog
        .open(...roomAuthenticationModalCreator({ roomId: this.room.roomId }))
        .afterClosed()
        .pipe(
          switchMap((result) => {
            if (result && result?.joined) {
              return this.estimatorService.getRoomById(this.room.roomId);
            } else {
              this.errorGoBackToJoinPage({});
              return EMPTY;
            }
          })
        );
    } else {
      const message =
        error instanceof NotLoggedInError
          ? "You've been signed out"
          : undefined;
      this.errorGoBackToJoinPage({ message });
      return EMPTY;
    }
  }

  private joinAsObserver() {
    if (!this.isObserver) {
      this.snackBar
        .open(
          'You are currently observing this estimation.',
          'Join as an Estimator',
          { duration: 10000, horizontalPosition: 'right' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['join'], {
            queryParams: { roomId: this.room.roomId },
          });
        });
    }
    this.isObserver = true;
  }

  private showOrHideAloneInRoomModal() {
    this.shouldShowAloneInRoom =
      this.room.members.length <= 1 &&
      (this.currentRound > 0 || this.currentEstimate !== undefined) &&
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
    if (!user.photoURL) {
      this.snackBar.dismiss();
      this.snackBar
        .open(
          'Stand out from the crowd by adding your avatar! 🤩 The avatar helps others recognize your votes.',
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

  private errorGoBackToJoinPage({
    message = 'Something went wrong. Please try again later.',
    duration = 5000,
  }: {
    message?: string;
    duration?: number | null;
  }) {
    this.snackBar.open(message, null, {
      duration: duration === null ? undefined : duration,
      horizontalPosition: 'right',
    });
    this.router.navigate(['join']);
  }

  playNotificationSound() {
    if (!this.isMuted) {
      const audio = new Audio();
      audio.src = '../../assets/notification.mp3';
      audio.load();
      audio.play();
    }
  }

  async topicBlur(event: TopicEditorInputOutput) {
    this.isEditingTopic = false;
    await this.estimatorService.setTopic(
      this.room,
      this.currentRound,
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
            this.isEditingTopic = true;
          }
        }),
        first()
      )
      .subscribe();
  }

  reCalculateStatistics() {
    if (this.room?.rounds) {
      const statistics: RoundStatistics[] = [
        ...Object.values(this.room.rounds).map((round) =>
          this.calculateRoundStatistics(round)
        ),
      ];
      this.roundStatistics = statistics;
    }
  }

  calculateRoundStatistics(round: Round) {
    const elapsed = getHumanReadableElapsedTime(round);
    const estimates = Object.keys(round.estimates)
      .filter((member) => this.room.members.map((m) => m.id).includes(member))
      .map((member) => ({
        value: round.estimates[member],
        voter: this.room.members.find((m) => m.id === member)?.name,
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
      const mostPopularVoteEntry: [string, number] = Object.entries<number>(
        votesCount
      ).sort((a, b) => b[1] - a[1])[0];

      return {
        average,
        elapsed,
        lowestVote: lowest,
        highestVote: highest,
        consensus: {
          value: +mostPopularVoteEntry[0],
          isConsensus: mostPopularVoteEntry[1] === estimates.length,
        },
      };
    }
  }

  toggleMute() {
    this.isMuted
      ? this.analytics.logClickedEnableSound()
      : this.analytics.logClickedDisableSound();
    this.isMuted = !this.isMuted;
  }

  onCreateAccountClicked() {
    this.analytics.logClickedCreateAccount('room');
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }

  openPremiumLearnMoreModal() {
    this.analytics.logClickedLearnMorePremium('room_navbar');
    this.dialog.open(...premiumLearnMoreModalCreator());
  }

  async copyRoomId() {
    this.analytics.logClickedShareRoom('main');
    let message = '';
    const host = window.origin || 'https://card-estimator.web.app';
    const roomUrl = `${host}/join?roomId=${this.room.roomId}`;
    if (this.config.runningIn === 'zoom') {
      try {
        const { invitationUUID } = await this.zoomService.inviteAllParticipants(
          this.room.roomId
        );
        await this.estimatorService.saveInvitation(
          invitationUUID,
          this.room.roomId
        );
        message = 'Invitation sent to all participants!';
      } catch {
        message = 'Please start a meeting first to invite others to join.';
      }
    } else if (this.config.runningIn === 'webex') {
      const shareSessionStarted = await this.webexService.inviteAllParticipants(
        this.room.roomId
      );
      message = shareSessionStarted
        ? 'All ready, click the "Open for all" button below!'
        : 'Join link copied to clipboard for non-Webex participants.';
      if (!shareSessionStarted) {
        this.clipboard.copy(roomUrl);
      }
    } else if (this.config.runningIn === 'teams') {
      const link = await this.teamsService.inviteAllParticipants(
        this.room.roomId
      );
      message =
        'Meeting link copied, share it in the chat or open the app in Stage Mode.';
      this.clipboard.copy(link);
    } else {
      this.clipboard.copy(roomUrl);
      message = 'Join link copied to clipboard.';
    }

    this.toastService.showMessage(message);
  }
}
