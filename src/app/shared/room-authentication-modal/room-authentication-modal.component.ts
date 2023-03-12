import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
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
    maxHeight: '90vh',
    data,
  },
];

type RequiredAuth = 'both' | 'password' | 'organization' | 'unknown';

@Component({
  selector: 'app-room-authentication-modal',
  templateUrl: './room-authentication-modal.component.html',
  styleUrls: ['./room-authentication-modal.component.scss'],
})
export class RoomAuthenticationModalComponent implements OnInit, OnDestroy {
  roomPassword = new FormControl('', [Validators.required]);
  destroy = new Subject<void>();
  errorMessage = new Subject<string>();

  authTypeRequired: RequiredAuth = 'unknown';
  authTypeRequired$: Observable<RequiredAuth> = this.estimatorService
    .getAuthorizationMetadata(this.dialogData.roomId)
    .pipe(
      map((authMeta) => {
        return authMeta?.passwordProtectionEnabled &&
          authMeta?.organizationProtection
          ? 'both'
          : authMeta?.passwordProtectionEnabled
          ? 'password'
          : authMeta?.organizationProtection
          ? 'organization'
          : 'unknown';
      }),
      map((result) => result as RequiredAuth),
      takeUntil(this.destroy)
    );

  isJoiningRoom = false;

  constructor(
    private readonly estimatorService: EstimatorService,
    public dialogRef: MatDialogRef<RoomAuthenticationModalComponent>,
    private router: Router,
    private readonly analytics: AnalyticsService,
    @Inject(MAT_DIALOG_DATA)
    private readonly dialogData: RoomAuthenticationModalData
  ) {}

  ngOnInit(): void {
    this.authTypeRequired$.subscribe(
      (value) => (this.authTypeRequired = value)
    );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async joinRoomWithPassword() {
    this.errorMessage.next('');
    try {
      this.isJoiningRoom = true;
      await this.estimatorService.joinRoomWithPassword(
        this.dialogData.roomId,
        this.roomPassword.value
      );
      this.dialogRef.close({ joined: true });
      this.router.navigate(['room', this.dialogData.roomId]);
    } catch (e) {
      console.error(e);
      this.errorMessage.next(e.message);
    } finally {
      this.isJoiningRoom = false;
    }
    this.analytics.logClickedJoinRoomWithPassword();
  }
}
