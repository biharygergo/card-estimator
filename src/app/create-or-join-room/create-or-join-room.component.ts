import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EstimatorService, Member } from '../estimator.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create-or-join-room',
  templateUrl: './create-or-join-room.component.html',
  styleUrls: ['./create-or-join-room.component.scss'],
})
export class CreateOrJoinRoomComponent implements OnInit {
  name = new FormControl('');
  roomId = new FormControl('');

  constructor(
    private estimatorService: EstimatorService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {}

  async joinRoom() {
    const member: Member = {
      id: null,
      name: this.name.value,
    };

    try {
      const updatedMember = await this.estimatorService.joinRoom(
        this.roomId.value,
        member
      );
      this.router.navigate([this.roomId.value], {
        queryParams: { member: updatedMember.id },
      });
    } catch (e) {
      this.snackBar.open(
        'Unable to join room. Please check the ID and try again.',
        null,
        { duration: 2000 }
      );
    }
  }

  async createRoom() {
    const newMember: Member = {
      id: null,
      name: this.name.value,
    };

    const { room, member } = await this.estimatorService.createRoom(newMember);
    this.router.navigate([room.roomId], {
      queryParams: { member: member.id },
    });
  }
}
