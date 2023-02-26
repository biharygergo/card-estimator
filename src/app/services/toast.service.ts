import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  constructor(private readonly snackbar: MatSnackBar) {}

  showMessage(message: string) {
    this.snackbar.open(message, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }
}
