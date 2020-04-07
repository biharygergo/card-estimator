import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EstimatorService, Member } from '../estimator.service';
import { Router } from '@angular/router';

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
    private router: Router
  ) {}

  ngOnInit(): void {}

  async joinRoom() {
    const member: Member = {
      id: null,
      name: this.name.value,
    };

    const updatedMember = await this.estimatorService.joinRoom(
      this.roomId.value,
      member
    );
    this.router.navigate([this.roomId.value], {
      queryParams: { member: updatedMember.id },
    });
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
