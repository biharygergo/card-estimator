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
  distinctUntilChanged,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from 'rxjs';
import {
  CardSet,
  CardSetValue,
  CARD_SETS,
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
import { ConfigService } from '../services/config.service';
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
  roundStatistics: RoundStatistics[];

  roomSubscription: Subscription;

  adHideClicks = 0;
  adsEnabled = false;

  showAds = false;

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
    const roomId = this.route.snapshot.paramMap.get('roomId');

    if (this.config.isRunningInZoom) {
      this.zoomService.configureApp();
    }

    if (this.route.snapshot.data.room) {
      this.onRoomUpdated(this.route.snapshot.data.room, roomId);
    }

    this.roomSubscription = this.estimatorService.currentRoom.subscribe(
      (room) => this.onRoomUpdated(room, roomId),
      (error) => this.onRoomUpdateError(error)
    );

    this.authService.avatarUpdated
      .pipe(
        takeUntil(this.destroy),
        distinctUntilChanged(),
        tap((photoURL: string) => {
          this.estimatorService.updateCurrentUserMemberAvatar(
            this.room,
            photoURL
          );
        })
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
  }

  private onRoomUpdated(room: Room, roomId: string) {
    const oldRoom: Room | undefined =
      this.room === undefined
        ? undefined
        : JSON.parse(JSON.stringify(this.room));

    this.room = room;
    this.rounds = Object.values(room.rounds);
    const roundNumberOrFallback =
      room.currentRound ?? Object.keys(room.rounds).length - 1;
    const newRoundNumber = roundNumberOrFallback;

    if (
      oldRoom === undefined ||
      oldRoom.cardSet !== room.cardSet ||
      (room.customCardSetValue &&
        JSON.stringify(oldRoom.customCardSetValue) !==
          JSON.stringify(room.customCardSetValue))
    ) {
      this.updateSelectedCardSets();
    }

    if (
      newRoundNumber !== this.currentRound &&
      this.currentRound !== undefined
    ) {
      this.playNotificationSound();
    }

    this.currentRound = roundNumberOrFallback;
    if (!this.estimatorService.activeMember) {
      this.joinAsObserver(roomId);
    } else {
      this.currentEstimate =
        this.room.rounds[this.currentRound].estimates[
          this.estimatorService.activeMember.id
        ];
    }
    this.showOrHideAloneInRoomModal();
    this.reCalculateStatistics(room);
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

  private joinAsObserver(roomId: string) {
    if (!this.isObserver) {
      this.snackBar
        .open(
          'You are currently observing this estimation.',
          'Join as an Estimator',
          { duration: 10000, horizontalPosition: 'right' }
        )
        .onAction()
        .subscribe(() => {
          this.router.navigate(['join'], { queryParams: { roomId } });
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
          this.dialog.open(...avatarModalCreator());
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

  reCalculateStatistics(room: Room) {
    const statistics: RoundStatistics[] = [
      ...Object.values(room.rounds).map((round) =>
        this.calculateRoundStatistics(round)
      ),
    ];
    this.roundStatistics = statistics;
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
      this.roomSubscription?.unsubscribe();
      if (this.estimatorService.activeMember) {
        await this.estimatorService.removeMember(
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
}
