import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  confirmDialogCreator,
} from './confirm-dialog.component';
import { Observable, first } from 'rxjs';

const DEFAULT_DIALOG_DATA: ConfirmDialogData = {
  title: 'Are you sure?',
  content: 'This action has consequences.',
  positiveText: "I'm sure",
  negativeText: 'Cancel',
};

@Injectable({
  providedIn: 'root',
})
export class ConfirmDialogService {
  constructor(private readonly dialog: MatDialog) {}

  openConfirmationDialog(data: Partial<ConfirmDialogData>): Promise<boolean> {
    const openWithData: ConfirmDialogData = { ...DEFAULT_DIALOG_DATA, ...data };

    const dialogRef = this.dialog.open<ConfirmDialogComponent, any, boolean>(
      ...confirmDialogCreator(openWithData)
    );

    return new Promise(resolve => {
      dialogRef
        .afterClosed()
        .pipe(first())
        .subscribe(isSure => resolve(isSure));
    });
  }
}
