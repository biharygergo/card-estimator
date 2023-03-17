import { Injectable } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarRef,
  TextOnlySnackBar,
} from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private readonly snackbar: MatSnackBar) {}

  showMessage(
    message: string,
    duration: number = 3000,
    category: 'info' | 'error' = 'info',
    action: string | null = null
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackbar.open(message, action, {
      duration,
      horizontalPosition: 'right',
      panelClass: 'snackbar-' + category,
    });
  }
}
