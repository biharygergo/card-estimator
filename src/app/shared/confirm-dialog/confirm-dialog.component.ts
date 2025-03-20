import { Component, Inject } from '@angular/core';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

export interface ConfirmDialogData {
  title: string;
  content: string;
  positiveText: string;
  negativeText: string;
  removeNegativeOption?: boolean;
  disableClose?: boolean;
}

export const confirmDialogCreator = (
  data: ConfirmDialogData
): ModalCreator<ConfirmDialogComponent> => [
  ConfirmDialogComponent,
  {
    id: 'confirmModal',
    width: '90%',
    maxWidth: '400px',
    data,
    panelClass: 'custom-dialog',
    disableClose: data.disableClose,
  },
];

@Component({
    selector: 'app-confirm-dialog',
    templateUrl: './confirm-dialog.component.html',
    styleUrls: ['./confirm-dialog.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButton,
        MatDialogClose,
    ]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}
