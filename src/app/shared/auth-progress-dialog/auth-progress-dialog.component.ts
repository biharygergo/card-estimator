import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  AuthIntent,
  AuthService,
  ParsedSessionCookie,
} from 'src/app/services/auth.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { FirebaseError } from '@angular/fire/app';
import { Router } from '@angular/router';

export const AUTH_PROGRESS_MODAL = 'auth-progress-modal';

export enum AuthProgressState {
  IN_PROGRESS = 'IN_PROGRESS',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  ACCOUNT_EXISTS = 'ACCOUNT_EXISTS',
}
export interface AuthProgressDialogData {
  initialState: AuthProgressState;
  startAccountSetupOnOpen: boolean;
  authData?: ParsedSessionCookie;
  idToken?: string;
}

export const authProgressDialogCreator = (
  data: AuthProgressDialogData
): ModalCreator<AuthProgressDialogComponent> => [
  AuthProgressDialogComponent,
  {
    id: AUTH_PROGRESS_MODAL,
    width: '90%',
    maxWidth: '300px',
    data,
  },
];

enum AuthAction {
  SIGN_IN,
  LINK_ACCOUNT,
}

@Component({
  selector: 'app-auth-progress-dialog',
  templateUrl: './auth-progress-dialog.component.html',
  styleUrls: ['./auth-progress-dialog.component.scss'],
})
export class AuthProgressDialogComponent implements OnInit, OnDestroy {
  state = new BehaviorSubject<AuthProgressState>(AuthProgressState.IN_PROGRESS);
  authIntent = new Subject<AuthIntent>();
  sessionCookie: ParsedSessionCookie | undefined;
  authFinished = false;

  returnPath: string | undefined;
  hasAction: boolean = false;

  errorMessage = '';

  readonly AuthProgressState = AuthProgressState;

  private readonly destroy = new Subject<void>();

  onAuthAction: Observable<AuthAction | undefined> = combineLatest([
    this.authService.user,
    this.authIntent,
  ]).pipe(
    map(([user, authIntent]) => {
      if (authIntent === AuthIntent.SIGN_IN) {
        return AuthAction.SIGN_IN;
      } else if (user && authIntent === AuthIntent.LINK_ACCOUNT) {
        return AuthAction.LINK_ACCOUNT;
      }

      return undefined;
    }),
    takeUntil(this.destroy)
  );

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    public dialogRef: MatDialogRef<AuthProgressDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private readonly dialogData: AuthProgressDialogData,
  ) {
    this.state.next(dialogData.initialState);
  }

  async ngOnInit(): Promise<void> {
    this.state.pipe(takeUntil(this.destroy)).subscribe((state) => {
      this.hasAction =
        state === AuthProgressState.ACCOUNT_EXISTS || !!this.returnPath;
    });

    if (this.dialogData.startAccountSetupOnOpen) {
      this.onAuthAction.subscribe((authAction) =>
        this.handleAuthAction(authAction)
      );
      try {
        if (!this.dialogData.authData) {
          this.sessionCookie =
            this.authService.getSessionCookie() as ParsedSessionCookie;
          this.authService.clearSessionCookie();
        } else {
          this.sessionCookie = this.dialogData.authData;
        }
        this.returnPath = this.sessionCookie.returnToPath;
        this.authIntent.next(this.sessionCookie.authIntent);
      } catch (e) {
        this.state.next(AuthProgressState.ERROR);
        this.errorMessage = e.message;
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async handleAuthAction(authAction: AuthAction) {
    if (authAction === undefined || this.authFinished) {
      return;
    }

    try {
      if (authAction === AuthAction.LINK_ACCOUNT) {
        await this.authService.linkAccountWithGoogle(
          this.sessionCookie.idToken
        );
      } else if (authAction === AuthAction.SIGN_IN) {
        await this.authService.signInWithGoogle(this.sessionCookie.idToken);
      }
      this.authFinished = true;
      this.state.next(AuthProgressState.SUCCESS);
    } catch (e) {
      if (
        (e as FirebaseError)?.code ===
          'auth/account-exists-with-different-credential' ||
        (e as FirebaseError)?.code === 'auth/credential-already-in-use'
      ) {
        this.state.next(AuthProgressState.ACCOUNT_EXISTS);
      } else {
        this.state.next(AuthProgressState.ERROR);
      }
      this.errorMessage = e.message;
    }
  }

  returnToPrevious() {
    this.dialogRef.close();
    this.router.navigateByUrl(this.returnPath);
  }

  signOut() {
    this.dialog.closeAll();
    this.authService.signOut();
  }
}
