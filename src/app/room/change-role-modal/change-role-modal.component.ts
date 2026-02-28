import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { NgClass } from '@angular/common';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { MemberType, Room } from 'src/app/types';

export interface ChangeRoleModalData {
  room: Room;
  currentMemberType: MemberType;
}

const CHANGE_ROLE_MODAL = 'change-role';

export const changeRoleModalCreator = (
  data: ChangeRoleModalData
): ModalCreator<ChangeRoleModalComponent> => [
  ChangeRoleModalComponent,
  {
    id: CHANGE_ROLE_MODAL,
    width: '90%',
    maxWidth: '360px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'change-role-modal',
  templateUrl: './change-role-modal.component.html',
  styleUrls: ['./change-role-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatIcon,
    MatButton,
    NgClass,
  ],
})
export class ChangeRoleModalComponent {
  currentMemberType: MemberType;
  room: Room;
  readonly MemberType = MemberType;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ChangeRoleModalData,
    private readonly dialogRef: MatDialogRef<ChangeRoleModalComponent>,
    private readonly estimatorService: EstimatorService,
    private readonly permissionsService: PermissionsService
  ) {
    this.room = data.room;
    this.currentMemberType = data.currentMemberType;
  }

  async selectRole(newType: MemberType) {
    if (newType === this.currentMemberType) {
      this.dialogRef.close();
      return;
    }
    await this.estimatorService.updateMemberType(
      this.room.roomId,
      this.estimatorService.activeMember,
      newType
    );
    this.permissionsService.initializePermissions(
      this.room,
      this.estimatorService.activeMember.id
    );
    this.currentMemberType = newType;
    this.dialogRef.close();
  }
}
