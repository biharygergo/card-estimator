import {Component, Inject} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import {FormControl, ReactiveFormsModule, Validators} from '@angular/forms';
import {BehaviorSubject} from 'rxjs';
import {AuthIntent, AuthService} from 'src/app/services/auth.service';
import {ModalCreator} from '../avatar-selector-modal/avatar-selector-modal.component';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatError} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatIcon} from '@angular/material/icon';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {AsyncPipe} from '@angular/common';

export const DEVICE_CODE_MODAL = 'device-code-modal';

export interface DeviceCodeDialogData {
  authIntent: AuthIntent;
  provider: string;
}

export const deviceCodeDialogCreator = (
  data: DeviceCodeDialogData
): ModalCreator<DeviceCodeDialogComponent> => [
  DeviceCodeDialogComponent,
  {
    id: DEVICE_CODE_MODAL,
    width: '90%',
    maxWidth: '460px',
    panelClass: 'custom-dialog',
    data,
  },
];

type DialogState = 'input' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-device-code-dialog',
  templateUrl: './device-code-dialog.component.html',
  styleUrls: ['./device-code-dialog.component.scss'],
  imports: [
    MatDialogContent,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatIcon,
    MatProgressSpinner,
    ReactiveFormsModule,
    AsyncPipe,
  ],
})
export class DeviceCodeDialogComponent {
  codeControl = new FormControl('', {
    validators: [Validators.required, Validators.minLength(6), Validators.maxLength(6)],
    nonNullable: true,
  });

  state = new BehaviorSubject<DialogState>('input');
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    public dialogRef: MatDialogRef<DeviceCodeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeviceCodeDialogData
  ) {}

  async submitCode() {
    if (!this.codeControl.valid) return;

    this.state.next('loading');
    this.errorMessage = '';

    try {
      const result = await this.authService.redeemDeviceCode(
        this.codeControl.value
      );

      if (result.provider === 'google') {
        if (result.authIntent === AuthIntent.LINK_ACCOUNT) {
          await this.authService.linkAccountWithGoogle(result.idToken);
        } else {
          await this.authService.signInWithGoogle(result.idToken);
        }
      } else if (result.provider === 'microsoft') {
        if (result.authIntent === AuthIntent.LINK_ACCOUNT) {
          await this.authService.linkAccountWithMicrosoft(result.idToken);
        } else {
          await this.authService.signInWithMicrosoft(result.idToken);
        }
      } else {
        throw new Error('Unknown provider: ' + result.provider);
      }

      this.state.next('success');
      setTimeout(() => this.dialogRef.close(true), 1500);
    } catch (e: any) {
      this.state.next('error');
      this.errorMessage = e?.message || 'An unknown error occurred.';
    }
  }

  retry() {
    this.state.next('input');
    this.errorMessage = '';
    this.codeControl.reset();
  }
}
