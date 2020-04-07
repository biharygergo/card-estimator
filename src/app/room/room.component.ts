import { Component, OnInit } from '@angular/core';
import { EstimatorService, Room } from '../estimator.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit {
  room: Room;
  currentRound = 0;
  estimationValues = [0, 0.5, 1, 1.5, 2, 3];

  constructor(
    private estimatorService: EstimatorService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    const memberId = this.route.snapshot.queryParamMap.get('member');

    this.estimatorService.refreshCurrentRoom(roomId, memberId);

    this.estimatorService.currentRoom.subscribe(
      (room) => {
        this.room = room;
        this.currentRound = room.rounds.length - 1;
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
}
