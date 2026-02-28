import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ToastService } from 'src/app/services/toast.service';
import { Room } from 'src/app/types';
import { AsyncPipe } from '@angular/common';

export interface VotingSettingsModalData {
  room: Room;
}

const VOTING_SETTINGS_MODAL = 'voting-settings';

export const votingSettingsModalCreator = (
  data: VotingSettingsModalData
): ModalCreator<VotingSettingsModalComponent> => [
  VotingSettingsModalComponent,
  {
    id: VOTING_SETTINGS_MODAL,
    width: '90%',
    maxWidth: '420px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'voting-settings-modal',
  templateUrl: './voting-settings-modal.component.html',
  styleUrls: ['./voting-settings-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatSlideToggle,
    MatIcon,
    MatButton,
    AsyncPipe,
  ],
})
export class VotingSettingsModalComponent {
  room: Room;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VotingSettingsModalData,
    private readonly dialogRef: MatDialogRef<VotingSettingsModalComponent>,
    private readonly analytics: AnalyticsService,
    private readonly estimatorService: EstimatorService,
    public readonly permissionsService: PermissionsService,
    private readonly toastService: ToastService
  ) {
    this.room = data.room;
  }

  toggleAutoReveal() {
    this.analytics.logToggleAutoReveal(!this.room.isAutoRevealEnabled);
    this.estimatorService.toggleAutoReveal(
      this.room.roomId,
      !this.room.isAutoRevealEnabled
    );
    this.room = {
      ...this.room,
      isAutoRevealEnabled: !this.room.isAutoRevealEnabled,
    };
    this.toastService.showMessage(
      'Auto reveal is now ' +
        (this.room.isAutoRevealEnabled ? 'enabled' : 'disabled') +
        '.'
    );
  }

  toggleAsyncVoting() {
    this.analytics.logToggleAsyncVote(!this.room.isAsyncVotingEnabled);
    this.estimatorService.toggleAsyncVoting(
      this.room.roomId,
      !this.room.isAsyncVotingEnabled
    );
    this.room = {
      ...this.room,
      isAsyncVotingEnabled: !this.room.isAsyncVotingEnabled,
    };
  }

  toggleAnonymousVoting() {
    this.analytics.logToggleAnonymousVote(!this.room.isAnonymousVotingEnabled);
    this.estimatorService.toggleAnonymousVoting(
      this.room.roomId,
      !this.room.isAnonymousVotingEnabled
    );
    this.room = {
      ...this.room,
      isAnonymousVotingEnabled: !this.room.isAnonymousVotingEnabled,
    };
  }

  toggleChangeVoteAfterReveal() {
    this.analytics.logToggleChangeVoteAfterReveal(
      !this.room.isChangeVoteAfterRevealEnabled
    );
    this.estimatorService.toggleChangeVoteAfterReveal(
      this.room.roomId,
      !this.room.isChangeVoteAfterRevealEnabled
    );
    this.room = {
      ...this.room,
      isChangeVoteAfterRevealEnabled: !this.room.isChangeVoteAfterRevealEnabled,
    };
  }
}
