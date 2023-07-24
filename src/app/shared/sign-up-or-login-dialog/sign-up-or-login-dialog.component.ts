import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  BehaviorSubject,
  catchError,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService, AuthIntent } from 'src/app/services/auth.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../auth-progress-dialog/auth-progress-dialog.component';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { TeamsService } from 'src/app/services/teams.service';
import { ActivatedRoute } from '@angular/router';

export const SIGN_UP_OR_LOGIN_MODAL = 'signUpOrLoginModal';

export enum SignUpOrLoginIntent {
  LINK_ACCOUNT,
  SIGN_IN,
}

export interface SignUpOrLoginDialogData {
  intent: SignUpOrLoginIntent;
  titleOverride?: string;
  descriptionOverride?: string;
}
export const signUpOrLoginDialogCreator = (
  data: SignUpOrLoginDialogData
): ModalCreator<SignUpOrLoginDialogComponent> => [
  SignUpOrLoginDialogComponent,
  {
    id: SIGN_UP_OR_LOGIN_MODAL,
    width: '90%',
    maxWidth: '800px',
    panelClass: 'custom-dialog',
    data,
  },
];

@Component({
  selector: 'app-sign-up-or-login-dialog',
  templateUrl: './sign-up-or-login-dialog.component.html',
  styleUrls: ['./sign-up-or-login-dialog.component.scss'],
})
export class SignUpOrLoginDialogComponent implements OnInit, OnDestroy {
  onSignUpWithGoogleClicked = new Subject<void>();
  onCreateAccountClicked = new Subject<'sign-in' | 'sign-up'>();

  form = new FormGroup({
    email: new FormControl<string>('', {
      validators: [Validators.email, Validators.required],
      nonNullable: true,
    }),
    password: new FormControl<string>('', {
      validators: [Validators.minLength(8), Validators.required],
      nonNullable: true,
    }),
  });

  isBusy = new BehaviorSubject<boolean>(false);
  errorMessage$ = new Subject<string>();
  destroy = new Subject<void>();

  intent: SignUpOrLoginIntent;

  readonly SignUpOrLoginIntent = SignUpOrLoginIntent;
  constructor(
    private readonly authService: AuthService,
    private readonly analyticsService: AnalyticsService,
    private readonly zoomApiService: ZoomApiService,
    private readonly dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA)
    public readonly dialogData: SignUpOrLoginDialogData,
    public dialogRef: MatDialogRef<SignUpOrLoginDialogComponent>,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly teamsService: TeamsService,
    private readonly route: ActivatedRoute
  ) {
    this.intent = dialogData.intent;
  }

  ngOnInit() {
    this.onSignUpWithGoogleClicked
      .pipe(
        switchMap(() => {
          this.isBusy.next(true);
          this.errorMessage$.next('');
          if (this.intent === SignUpOrLoginIntent.LINK_ACCOUNT) {
            return this.linkAccountWithGoogle();
          } else {
            return this.signInWithGoogle();
          }
        }),
        tap(() =>
          this.analyticsService.logClickedSignUpWithGoogle('sign-in-dialog')
        ),
        takeUntil(this.destroy)
      )
      .subscribe((success) => {
        if (success) {
          this.dialogRef.close();
        }
      });

    this.onCreateAccountClicked
      .pipe(
        switchMap((signupType) => {
          this.isBusy.next(true);
          this.errorMessage$.next('');
          const email = this.form.value.email;
          const password = this.form.value.password;
          let signInPromise: Promise<any>;
          if (this.dialogData.intent === SignUpOrLoginIntent.LINK_ACCOUNT) {
            signInPromise = this.authService.linkAccountWithEmailAndPassword(
              email,
              password
            );
          } else {
            signInPromise =
              signupType === 'sign-in'
                ? this.authService.signInWithEmailAndPassword(email, password)
                : this.authService.signUpWithEmailAndPassword(email, password);
          }
          return from(signInPromise).pipe(
            map(() => true),
            catchError((error) => this.handleUnknownAuthError(error))
          );
        }),
        tap(() => this.analyticsService.logClickedSignIn('create')),
        takeUntil(this.destroy)
      )
      .subscribe((success) => {
        if (success) {
          this.dialogRef.close();
        }
      });
  }

  private linkAccountWithGoogle(): Observable<void | {}> {
    let signInPromise: Promise<void>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.linkAccountWithGoogleInZoom();
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      signInPromise = this.teamsService
        .getGoogleOauthToken(returnTo)
        .then((token) => {
          return this.authService.linkAccountWithGoogle(token);
        });
    } else {
      signInPromise = this.linkAccountWithGoogleWeb();
    }
    return from(signInPromise).pipe(
      tap(() => {
        this.isBusy.next(false);
      }),
      map(() => true),
      catchError((error) => {
        return this.handleUnknownAuthError(error);
      })
    );
  }

  private async linkAccountWithGoogleWeb(): Promise<void> {
    return this.authService.linkAccountWithGoogle().catch((error) => {
      if (error.code === 'auth/credential-already-in-use') {
        this.dialog.open(
          ...authProgressDialogCreator({
            initialState: AuthProgressState.ACCOUNT_EXISTS,
            startAccountSetupOnOpen: false,
          })
        );
      } else {
        throw error;
      }
    });
  }

  private handleUnknownAuthError(error: Error): Observable<boolean> {
    this.isBusy.next(false);
    console.error(error);
    this.errorMessage$.next(error.message);
    return of(false);
  }

  private async linkAccountWithGoogleInZoom(): Promise<void> {
    this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: false,
      })
    );
    await this.zoomApiService.openUrl(
      this.authService.getApiAuthUrl(
        AuthIntent.LINK_ACCOUNT
        // this.activatedRoute.snapshot.toString()
      ),
      true
    );

    // This promise never resolves, as the app will be reloaded on Auth success
    return new Promise(() => {});
  }

  private async signInWithGoogle() {
    let signInPromise: Promise<any>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.signInWithGoogleInZoom();
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      signInPromise = this.teamsService
        .getGoogleOauthToken(returnTo)
        .then((token) => {
          return this.authService.signInWithGoogle(token);
        });
    } else {
      signInPromise = this.signInWithGoogleWeb();
    }
    return from(signInPromise).pipe(
      tap(() => {
        this.isBusy.next(false);
      }),
      map(() => true),
      catchError((error) => {
        return this.handleUnknownAuthError(error);
      })
    );
  }

  private signInWithGoogleWeb() {
    return this.authService.signInWithGoogle();
  }

  private signInWithGoogleInZoom() {
    this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: false,
      })
    );
    return this.zoomApiService.openUrl(
      this.authService.getApiAuthUrl(AuthIntent.SIGN_IN),
      true
    );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
