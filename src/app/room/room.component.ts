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
  saveJoinedRoomData,
} from '../services/estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  share,
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
  Member,
  MemberStatus,
  MemberType,
  Room,
  Round,
  RoundStatistics,
} from '../types';
import { MatDialog } from '@angular/material/dialog';
import { AloneInRoomModalComponent } from './alone-in-room-modal/alone-in-room-modal.component';
import { AnalyticsService } from '../services/analytics.service';
import {
  createTimer,
  getHumanReadableElapsedTime,
  isRunningInZoom,
} from '../utils';
import { AddCardDeckModalComponent } from './add-card-deck-modal/add-card-deck-modal.component';
import { getRoomCardSetValue } from '../pipes/estimate-converter.pipe';
import {
  ConfigService,
  FEEDBACK_FORM_FILLED_COOKIE_KEY,
} from '../services/config.service';
import { MatSidenavContainer } from '@angular/material/sidenav';
import { AuthService } from '../services/auth.service';
import { avatarModalCreator } from '../shared/avatar-selector-modal/avatar-selector-modal.component';
import { AppConfig, APP_CONFIG } from '../app-config.module';
import { ZoomApiService } from '../services/zoom-api.service';

const ALONE_IN_ROOM_MODAL = 'alone-in-room';
const ADD_CARD_DECK_MODAL = 'add-card-deck';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  @ViewChild('topicInput') topicInput: ElementRef;
  @ViewChild(MatSidenavContainer, { read: ElementRef })
  sidenav: MatSidenavContainer;

  destroy = new Subject<void>();

  room: Room;
  rounds: Round[] = [];
  currentRound = undefined;
  currentEstimate: number;

  estimationCardSets = Object.values(CARD_SETS);
  selectedEstimationCardSetValue = CARD_SETS[CardSet.DEFAULT];
  estimationValues = this.getSortedCardSetValues(
    this.selectedEstimationCardSetValue
  );

  roundTopic = new FormControl('');

  isEditingTopic = false;
  isObserver = false;
  isMuted = true;
  shouldShowAloneInRoom = false;
  isAloneInRoomHidden = false;
  roundStatistics: RoundStatistics[] = [];

  adHideClicks = 0;
  adsEnabled = false;

  showAds = false;

  room$: Observable<Room> = this.route.paramMap.pipe(
    map((params) => params.get('roomId')),
    switchMap((roomId) =>
      this.estimatorService
        .getRoomById(roomId)
        .pipe(startWith(this.route.snapshot.data.room))
    ),
    share(),
    takeUntil(this.destroy)
  );

  members$: Observable<Member[]> = this.room$.pipe(
    map((room) => room.members),
    distinctUntilChanged(),
    map((members) =>
      members
        .filter(
          (m) => m.status === MemberStatus.ACTIVE || m.status === undefined
        )
        .sort((a, b) => a.type?.localeCompare(b.type))
    ),
    takeUntil(this.destroy)
  );

  onRoomUpdated$ = this.room$.pipe(
    tap((room) => {
      this.onRoomUpdated(room);
    }),
    takeUntil(this.destroy)
  );

  onActiveMemberUpdated$ = combineLatest([
    this.room$,
    this.authService.user,
  ]).pipe(
    filter(([_room, user]) => !!user),
    map(([room, user]) => room.members.find((m) => m.id === user.uid)?.type),
    distinctUntilChanged(),
    tap((memberType) => {
      if (memberType === MemberType.OBSERVER) {
        this.joinAsObserver();
      }
    })
  );

  onRoundNumberUpdated$: Observable<number> = this.room$.pipe(
    map((room) => room.currentRound),
    distinctUntilChanged(),
    tap((roundNumber) => {
      this.currentRound = roundNumber;
      this.playNotificationSound();
      this.showOrHideAloneInRoomModal();
    }),
    takeUntil(this.destroy)
  );

  onEstimatesUpdated$ = this.room$.pipe(
    map((room) => {
      const currentRound = room.rounds[room.currentRound ?? 0];
      return currentRound.estimates;
    }),
    distinctUntilChanged(
      (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
    ),
    tap((estimates) => {
      this.currentEstimate = estimates[this.estimatorService.activeMember.id];
      this.reCalculateStatistics();
    })
  );

  onCardSetUpdated$: Observable<CardSet | 'CUSTOM'> = this.room$.pipe(
    map((room) => room.cardSet),
    distinctUntilChanged(),
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

  showFeedbackForm$ = this.estimatorService.getPreviousSessions().pipe(
    map((sessions) => sessions.length),
    map((sessionCount) => {
      return (
        sessionCount > 1 &&
        this.configService.getCookie(FEEDBACK_FORM_FILLED_COOKIE_KEY) ===
          undefined
      );
    })
  );

  readonly MemberType = MemberType;

  openedFeedbackForm: boolean = false;

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private router: Router,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService,
    private configService: ConfigService,
    private authService: AuthService,
    private zoomService: ZoomApiService,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    if (this.config.isRunningInZoom) {
      this.zoomService.configureApp();
    }

    this.room$.subscribe({ error: (error) => this.onRoomUpdateError(error) });
    this.onRoomUpdated$.subscribe();
    this.onActiveMemberUpdated$.subscribe();
    this.onRoundNumberUpdated$.subscribe();
    this.onEstimatesUpdated$.subscribe();
    this.onCardSetUpdated$.subscribe();
    this.onNameUpdated$.subscribe();

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

    this.configService.isEnabled('adsEnabled').then((value) => {
      this.adsEnabled = value;
      this.updateShowAds();
    });

    createTimer(2)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        this.showAvatarPrompt();
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  private onRoomUpdated(room: Room) {
    this.room = room;
    this.rounds = Object.values(room.rounds);
  }

  private updateSelectedCardSets() {
    this.selectedEstimationCardSetValue = getRoomCardSetValue(this.room);
    this.estimationValues = this.getSortedCardSetValues(
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

  private onRoomUpdateError(error: Error) {
    this.errorGoBackToJoinPage();
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
          { duration: 20000, horizontalPosition: 'right' }
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

  private errorGoBackToJoinPage() {
    this.snackBar.open('Something went wrong. Please try again later.', null, {
      duration: 5000,
    });
    this.router.navigate(['join']);
  }

  showResults() {
    this.analytics.logClickedShowResults();
    this.estimatorService.setShowResults(this.room, this.currentRound, true);
  }

  newRound() {
    this.analytics.logClickedNewRound();
    this.estimatorService.newRound(this.room);
  }

  nextRound() {
    this.analytics.logClickedNextRound();
    this.estimatorService.setActiveRound(
      this.room,
      this.currentRound + 1,
      false
    );
  }

  playNotificationSound() {
    if (!this.isMuted) {
      const audio = new Audio();
      audio.src = '../../assets/notification.mp3';
      audio.load();
      audio.play();
    }
  }

  async topicBlur() {
    this.isEditingTopic = false;
    await this.estimatorService.setTopic(
      this.room,
      this.currentRound,
      this.roundTopic.value
    );
  }

  onTopicClicked() {
    this.analytics.logClickedTopicName();
    this.isEditingTopic = true;
    this.roundTopic.setValue(this.room.rounds[this.currentRound].topic);
    setTimeout(() => this.topicInput.nativeElement.focus(), 100);
  }

  async copyRoomId() {
    this.analytics.logClickedShareRoom('main');
    let message = '';
    if (this.config.isRunningInZoom) {
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
    } else {
      const host = window.origin || 'https://card-estimator.web.app';
      this.clipboard.copy(`${host}/join?roomId=${this.room.roomId}`);
      message = 'Join link copied to clipboard.';
    }

    this.snackBar.open(message, null, {
      duration: 2000,
      horizontalPosition: 'right',
    });
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
      .sort((a, b) => a.value - b.value);

    if (estimates.length) {
      const average =
        estimates
          .map((estimate) => estimate.value)
          .reduce((acc, curr) => acc + curr, 0) / estimates.length;
      const lowest = estimates[0];
      const highest = estimates[estimates.length - 1];

      return { average, elapsed, lowestVote: lowest, highestVote: highest };
    }
  }

  async leaveRoom() {
    this.analytics.logClickedLeaveRoom();
    if (
      isRunningInZoom() ||
      confirm('Do you really want to leave this estimation?')
    ) {
      if (this.estimatorService.activeMember) {
        await this.estimatorService.leaveRoom(
          this.room.roomId,
          this.estimatorService.activeMember
        );
        saveJoinedRoomData(undefined);
      }

      this.router.navigate(['join']);
    }
  }

  toggleMute() {
    this.isMuted
      ? this.analytics.logClickedEnableSound()
      : this.analytics.logClickedDisableSound();
    this.isMuted = !this.isMuted;
  }

  clickedUnitsButton() {
    this.analytics.logClickedUnits();
  }

  setEstimationCardSet(key: CardSet) {
    this.analytics.logSelectedCardSet(key);
    this.estimatorService.setRoomCardSet(this.room.roomId, key);
  }

  getCardSetDisplayValues(cardSet: CardSetValue | undefined) {
    if (!cardSet) {
      return '';
    }
    return this.getSortedCardSetValues(cardSet)
      .map((item) => item.value)
      .join(', ');
  }

  getSortedCardSetValues(
    cardSet: CardSetValue
  ): { key: string; value: string }[] {
    return Object.keys(cardSet.values)
      .sort((a, b) => +a - +b)
      .map((key) => {
        return { key, value: cardSet.values[key] };
      });
  }

  openAddCardDeckModal() {
    if (this.dialog.getDialogById(ADD_CARD_DECK_MODAL) === undefined) {
      this.analytics.logClickedSetCustomCards();
      const dialogRef = this.dialog.open(AddCardDeckModalComponent, {
        id: ADD_CARD_DECK_MODAL,
        width: '90%',
        maxWidth: '600px',
        disableClose: false,
        data: {
          roomId: this.room.roomId,
        },
      });

      dialogRef.afterClosed().subscribe(() => {});
    }
  }

  updateShowAds() {
    this.showAds = this.adHideClicks < 5 && this.adsEnabled;
  }

  increaseHideAdsCounter() {
    this.adHideClicks += 1;
  }

  openFeedbackForm() {
    if (this.config.isRunningInZoom) {
      this.zoomService.openUrl(window.origin + '/api/giveFeedback');
    } else {
      window.open('https://forms.gle/Rhd8mAQqCmewhfCR7');
    }

    this.openedFeedbackForm = true;
    this.configService.setCookie(FEEDBACK_FORM_FILLED_COOKIE_KEY, 'true');
  }
}
