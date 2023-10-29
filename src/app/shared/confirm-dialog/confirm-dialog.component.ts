import { Component, Inject } from '@angular/core';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  content: string;
  positiveText: string;
  negativeText: string;
}

export const confirmDialogCreator = (data: ConfirmDialogData): ModalCreator<ConfirmDialogComponent> => [
  ConfirmDialogComponent,
  {
    id: 'confirmModal',
    width: '90%',
    maxWidth: '400px',
    data,
    panelClass: 'custom-dialog'
  },
];

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}
}
