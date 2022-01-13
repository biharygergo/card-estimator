import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  EstimatorService,
  RoomNotFoundError,
  MemberNotFoundError,
  retrieveRoomData,
  saveJoinedRoomData,
} from '../estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { CardSet, CARD_SETS, Room, Round, RoundStatistics } from '../types';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  @ViewChild('topicInput') topicInput: ElementRef;

  readonly estimationCardSets = CARD_SETS;

  room: Room;
  rounds: Round[] = [];
  currentRound = undefined;
  currentEstimate: number;
  selectedEstimationCardSet = CardSet.DEFAULT;
  estimationValues = this.estimationCardSets[this.selectedEstimationCardSet].values;
  roundTopic = new FormControl('');

  isEditingTopic = false;
  isObserver = false;
  isMuted = false;
  roundStatistics: RoundStatistics[];

  roomSubscription: Subscription;

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private router: Router,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
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
      (room) => {
        this.room = room;
        this.rounds = Object.values(room.rounds);
        const newRoundNumber = Object.keys(room.rounds).length - 1;

        this.selectedEstimationCardSet = room.cardSet || CardSet.DEFAULT;
        this.estimationValues = this.estimationCardSets[this.selectedEstimationCardSet].values;

        console.log(room)
        if (
          newRoundNumber !== this.currentRound &&
          this.currentRound !== undefined
        ) {
          this.playNotificationSound();
        }

        this.currentRound = Object.keys(room.rounds).length - 1;
        if (!roomData?.memberId || !this.estimatorService.activeMember) {
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
        } else {
          this.currentEstimate =
            this.room.rounds[this.currentRound].estimates[
              this.estimatorService.activeMember.id
            ];
        }

        this.reCalculateStatistics(room);
      },
      (error) => {
        if (error instanceof RoomNotFoundError) {
          this.errorGoBackToJoinPage();
        } else if (error instanceof MemberNotFoundError) {
          this.isObserver = true;
        } else {
          this.errorGoBackToJoinPage();
        }
      }
    );
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
    this.estimatorService.setEstimate(
      this.room,
      this.currentRound,
      +amount,
      this.estimatorService.activeMember.id
    );
  }

  showResults() {
    this.estimatorService.setShowResults(this.room, this.currentRound, true);
  }

  newRound() {
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
    this.isEditingTopic = true;
    this.roundTopic.setValue(this.room.rounds[this.currentRound].topic);
    setTimeout(() => this.topicInput.nativeElement.focus(), 100);
  }

  copyRoomId() {
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
    let elapsed = '0m 0s';
    const estimates = Object.keys(round.estimates)
      .filter((member) => this.room.members.map((m) => m.id).includes(member))
      .map((member) => ({
        value: round.estimates[member],
        voter: this.room.members.find((m) => m.id === member)?.name,
      }))
      .sort((a, b) => a.value - b.value);
    if (!!round.started_at && !!round.finished_at) {
      const diff = round.finished_at.seconds - round.started_at.seconds;
      const minutes = Math.floor(diff / 60);
      const seconds = diff - minutes * 60;
      elapsed = `${minutes}m ${seconds}s`;
    }
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
    this.isMuted = !this.isMuted;
  }

  setEstimationCardSet(key: CardSet) {
    this.estimatorService.setRoomCardSet(this.room.roomId, key);
  }
}
