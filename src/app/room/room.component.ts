import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { EstimatorService, Room, Round } from '../estimator.service';
import { ActivatedRoute } from '@angular/router';
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
  estimationValues = [0, 0.5, 1, 1.5, 2, 3];
  roundTopic = new FormControl('');

  isEditingTopic = false;
  roundStatistics: RoundStatistics[];
  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute,
    private clipboard: Clipboard,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    const memberId = this.route.snapshot.queryParamMap.get('member');

    this.estimatorService.refreshCurrentRoom(roomId, memberId);

    this.estimatorService.currentRoom.subscribe(
      (room) => {
        this.room = room;
        this.currentRound = room.rounds.length - 1;
        this.roundTopic.setValue(this.room.rounds[this.currentRound].topic);
        this.currentEstimate = this.room.rounds[this.currentRound].estimates[
          this.estimatorService.activeMember.id
        ];
        this.reCalculateStatistics(room);
      },
      (error) => {
        console.error(error);
      }
    );
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
    setTimeout(() => this.topicInput.nativeElement.focus(), 100);
  }

  copyRoomId() {
    this.clipboard.copy(this.room.roomId);
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
