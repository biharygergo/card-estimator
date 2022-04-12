import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  EstimatorService,
  RoomNotFoundError,
  MemberNotFoundError,
  retrieveRoomData,
  saveJoinedRoomData,
} from '../services/estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import {
  CardSet,
  CardSetValue,
  CARD_SETS,
  Room,
  RoomData,
  Round,
  RoundStatistics,
} from '../types';
import { MatDialog } from '@angular/material/dialog';
import { AloneInRoomModalComponent } from './alone-in-room-modal/alone-in-room-modal.component';
import { AnalyticsService } from '../services/analytics.service';
import { SerializerService } from '../services/serializer.service';
import { getHumanReadableElapsedTime } from '../utils';
import { KeyValue } from '@angular/common';
import { AddCardDeckModalComponent } from './add-card-deck-modal/add-card-deck-modal.component';
import { getRoomCardSetValue } from '../pipes/estimate-converter.pipe';

const ALONE_IN_ROOM_MODAL = 'alone-in-room';
const ADD_CARD_DECK_MODAL = 'add-card-deck';
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  @ViewChild('topicInput') topicInput: ElementRef;

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

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private router: Router,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService,
    private serializer: SerializerService
  ) {}

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    const observing = this.route.snapshot.queryParamMap.get('observing');
    const roomData = retrieveRoomData();

    if (!roomId) {
      this.errorGoBackToJoinPage();
      return;
    }

    if (!roomData?.memberId && !observing) {
      this.router.navigate(['join'], { queryParams: { roomId } });
      return;
    }

    this.estimatorService.refreshCurrentRoom(roomId, roomData?.memberId);

    this.roomSubscription = this.estimatorService.currentRoom.subscribe(
      (room) => this.onRoomUpdated(room, roomData, roomId),
      (error) => this.onRoomUpdateError(error)
    );
  }

  private onRoomUpdated(room: Room, roomData: RoomData, roomId: string) {
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
    if (!roomData?.memberId || !this.estimatorService.activeMember) {
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
    if (error instanceof RoomNotFoundError) {
      this.errorGoBackToJoinPage();
    } else if (error instanceof MemberNotFoundError) {
      this.isObserver = true;
    } else {
      this.errorGoBackToJoinPage();
    }
  }

  private joinAsObserver(roomId: string) {
    if (!this.isObserver) {
      this.snackBar
        .open(
          'You are currently observing this estimation. Join with a name to estimate as well.',
          'Join with a Name',
          { duration: 10000 }
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
      this.room.members.length === 1 &&
      (this.currentRound > 0 || this.currentEstimate !== undefined) &&
      !this.isAloneInRoomHidden;
    if (this.shouldShowAloneInRoom) {
      this.openAloneInRoomModal();
    } else {
      this.closeAllDialogs();
    }
  }

  private closeAllDialogs() {
    this.dialog.closeAll();
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
          name: this.estimatorService.activeMember.name,
          onCopyLink: () => this.copyRoomId(),
        },
      });

      dialogRef.afterClosed().subscribe(() => {
        this.isAloneInRoomHidden = true;
      });
    }
  }

  private errorGoBackToJoinPage() {
    this.snackBar.open(
      'Unable to join this room. Please check the room ID and join again.',
      null,
      { duration: 5000 }
    );
    this.router.navigate(['join']);
  }

  setEstimate(amount: number) {
    this.analytics.logClickedVoteOption();
    this.estimatorService.setEstimate(
      this.room,
      this.currentRound,
      +amount,
      this.estimatorService.activeMember.id
    );
  }

  showResults() {
    this.analytics.logClickedShowResults();
    this.estimatorService.setShowResults(this.room, this.currentRound, true);
  }

  newRound() {
    this.analytics.logClickedNewRound();
    this.estimatorService.newRound(this.room);
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

  copyRoomId() {
    this.analytics.logClickedShareRoom('main');
    const host = window.origin || 'https://card-estimator.web.app';
    this.clipboard.copy(`${host}/join?roomId=${this.room.roomId}`);
    this.snackBar.open('Join link copied to clipboard.', null, {
      duration: 2000,
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
    if (confirm('Do you really want to leave this estimation?')) {
      if (this.estimatorService.activeMember) {
        this.roomSubscription?.unsubscribe();
        await this.estimatorService.removeMember(
          this.room.roomId,
          this.estimatorService.activeMember
        );
        saveJoinedRoomData(undefined);
      }

      this.router.navigate(['']);
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

  downloadAsCsv() {
    this.analytics.logClickedDownloadResults();
    this.serializer.exportRoomAsCsv(this.room);
  }

  setActiveRound(roundNumber: number) {
    this.analytics.logClickedReVote();
    this.estimatorService.setActiveRound(this.room, roundNumber);
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
}
