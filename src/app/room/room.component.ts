import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  EstimatorService,
  Room,
  Round,
  RoomNotFoundError,
  MemberNotFoundError,
} from '../estimator.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';

interface RoundStatistics {
  average: number;
  highestVote: {
    value: number;
    voter: string;
  };
  lowestVote: {
    value: number;
    voter: string;
  };
}
@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  @ViewChild('topicInput') topicInput: ElementRef;

  room: Room;
  currentRound = 0;
  currentEstimate: number;
  estimationValues = [0, 0.5, 1, 2, 3, 5];
  roundTopic = new FormControl('');

  isEditingTopic = false;
  isObserver = false;
  roundStatistics: RoundStatistics[];

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private router: Router,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    if (!roomId) {
      this.errorGoBackToJoinPage();
    }
    const memberId = this.route.snapshot.queryParamMap.get('member');

    this.estimatorService.refreshCurrentRoom(roomId, memberId);

    this.estimatorService.currentRoom.subscribe(
      (room) => {
        this.room = room;
        this.currentRound = room.rounds.length - 1;
        if (!memberId || !this.estimatorService.activeMember) {
          if (!this.isObserver) {
            this.snackBar.open(
              'You are currently observing this estimation. Join with a name to estimate as well.',
              'OK'
            );
          }
          this.isObserver = true;
        } else {
          this.currentEstimate = this.room.rounds[this.currentRound].estimates[
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
    this.router.navigate(['']);
  }

  setEstimate(amount: number) {
    this.room.rounds[this.currentRound].estimates[
      this.estimatorService.activeMember.id
    ] = amount;

    this.estimatorService.updateRoom(this.room);
  }

  showResults() {
    this.room.rounds[this.currentRound].show_results = true;
    this.estimatorService.updateRoom(this.room);
  }

  newRound() {
    this.estimatorService.newRound(this.room);
  }

  topicBlur() {
    this.isEditingTopic = false;
    this.room.rounds[this.currentRound].topic = this.roundTopic.value;
    this.estimatorService.updateRoom(this.room);
  }

  onTopicClicked() {
    this.isEditingTopic = true;
    this.roundTopic.setValue(this.room.rounds[this.currentRound].topic);
    setTimeout(() => this.topicInput.nativeElement.focus(), 100);
  }

  copyRoomId() {
    this.clipboard.copy(
      `https://card-estimator.web.app?roomId=${this.room.roomId}`
    );
    this.snackBar.open('Room ID copied to clipboard.', null, {
      duration: 2000,
    });
  }

  reCalculateStatistics(room: Room) {
    const statistics: RoundStatistics[] = [
      ...room.rounds.map((round) => this.calculateRoundStatistics(round)),
    ];
    this.roundStatistics = statistics;
  }

  calculateRoundStatistics(round: Round) {
    const estimates = Object.keys(round.estimates)
      .map((member) => ({
        value: round.estimates[member],
        voter: this.room.members.find((m) => m.id === member)?.name,
      }))
      .sort((a, b) => a.value - b.value);
    if (estimates.length) {
      const average =
        estimates
          .map((estimate) => estimate.value)
          .reduce((acc, curr) => acc + curr) / estimates.length;
      const lowest = estimates[0];
      const highest = estimates[estimates.length - 1];
      return { average, lowestVote: lowest, highestVote: highest };
    }
  }
}
