import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private readonly snackbar: MatSnackBar) {}

  showMessage(
    message: string,
    duration: number = 3000,
    category: 'info' | 'error' = 'info'
  ) {
    this.snackbar.open(message, null, {
      duration,
      horizontalPosition: 'right',
      panelClass: 'snackbar-' + category,
    });
  }
}
