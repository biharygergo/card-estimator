import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { map, Subject, takeUntil } from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import { Member } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

const ROOM_AUTHENTICATION_MODAL = 'roomAuthenticationModal';

export interface RoomAuthenticationModalData {
  roomId: string;
}

export const roomAuthenticationModalCreator = (
  data: RoomAuthenticationModalData
): ModalCreator<RoomAuthenticationModalComponent> => [
  RoomAuthenticationModalComponent,
  {
    id: ROOM_AUTHENTICATION_MODAL,
    width: '90%',
    maxWidth: '600px',
    data,
  },
];

@Component({
  selector: 'app-room-authentication-modal',
  templateUrl: './room-authentication-modal.component.html',
  styleUrls: ['./room-authentication-modal.component.scss'],
})
export class RoomAuthenticationModalComponent implements OnInit, OnDestroy {
  roomPassword = new FormControl('', [Validators.required]);
  destroy = new Subject<void>();
  errorMessage = new Subject<string>();

  authTypeRequired$ = this.estimatorService
    .getAuthorizationMetadata(this.dialogData.roomId)
    .pipe(
      map((authMeta) => {
        return authMeta?.passwordProtectionEnabled ? 'password' : 'unknown';
      }),
      takeUntil(this.destroy)
    );

  constructor(
    private readonly estimatorService: EstimatorService,
    public dialogRef: MatDialogRef<RoomAuthenticationModalComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    private readonly dialogData: RoomAuthenticationModalData
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async joinRoomWithPassword() {
    this.errorMessage.next('');
    try {
      await this.estimatorService.joinRoomWithPassword(
        this.dialogData.roomId,
        this.roomPassword.value
      );
      this.dialogRef.close({joined: true});
      this.router.navigate(['room', this.dialogData.roomId]);
    } catch (e) {
      console.error(e);
      this.errorMessage.next(e.message);
    }
  }
}
