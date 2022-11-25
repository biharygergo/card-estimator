import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AuthIntent,
  AuthService,
  ParsedSessionCookie,
} from 'src/app/services/auth.service';
import Cookies from 'js-cookie';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { FirebaseError } from '@angular/fire/app';
import { Router } from '@angular/router';

export const AUTH_PROGRESS_MODAL = 'auth-progress-modal';

export enum AuthProgressState {
  IN_PROGRESS,
  SUCCESS,
  ERROR,
  ACCOUNT_EXISTS,
}
export interface AuthProgressDialogData {
  initialState: AuthProgressState;
  startAccountSetupOnOpen: boolean;
}
export const authProgressDialogCreator = (
  data: AuthProgressDialogData
): ModalCreator<AuthProgressDialogComponent> => [
  AuthProgressDialogComponent,
  {
    id: AUTH_PROGRESS_MODAL,
    width: '90%',
    maxWidth: '250px',
    data,
  },
];

@Component({
  selector: 'app-auth-progress-dialog',
  templateUrl: './auth-progress-dialog.component.html',
  styleUrls: ['./auth-progress-dialog.component.scss'],
})
export class AuthProgressDialogComponent implements OnInit, OnDestroy {
  state = new BehaviorSubject<AuthProgressState>(AuthProgressState.IN_PROGRESS);
  returnPath: string | undefined;
  hasAction: boolean = false;

  errorMessage = '';

  readonly AuthProgressState = AuthProgressState;

  private readonly destroy = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(MAT_DIALOG_DATA) private readonly dialogData: AuthProgressDialogData
  ) {
    this.state.next(dialogData.initialState);
  }

  async ngOnInit(): Promise<void> {
    this.state.pipe(takeUntil(this.destroy)).subscribe((state) => {
      this.hasAction =
        state === AuthProgressState.ACCOUNT_EXISTS || !!this.returnPath;
    });

    if (this.dialogData.startAccountSetupOnOpen) {
      try {
        const sessionCookie =
          this.authService.getSessionCookie() as ParsedSessionCookie;
        this.authService.clearSessionCookie();
        this.returnPath = sessionCookie.returnToPath;
        if (sessionCookie.authIntent === AuthIntent.LINK_ACCOUNT) {
          await this.authService.linkAccountWithGoogle(sessionCookie.idToken);
        } else {
          await this.authService.signInWithGoogle(sessionCookie.idToken);
        }
      } catch (e) {
        if (
          (e as FirebaseError)?.code ===
          'auth/account-exists-with-different-credential'
        ) {
          this.state.next(AuthProgressState.ACCOUNT_EXISTS);
        }
        this.state.next(AuthProgressState.ERROR);
        this.errorMessage = e.message;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  returnToPrevious() {
    this.router.navigateByUrl(this.returnPath);
  }

  signOut() {
    this.authService.signOut();
  }
}
