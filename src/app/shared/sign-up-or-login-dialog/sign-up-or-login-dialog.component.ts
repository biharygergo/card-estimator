import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogContent,
} from '@angular/material/dialog';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  take,
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
import { ToastService } from 'src/app/services/toast.service';
import { AsyncPipe } from '@angular/common';
import { MatInput } from '@angular/material/input';
import {
  MatFormField,
  MatLabel,
  MatSuffix,
  MatError,
} from '@angular/material/form-field';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatDivider } from '@angular/material/divider';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ResizeMonitorDirective } from '../directives/resize-monitor.directive';

export const SIGN_UP_OR_LOGIN_MODAL = 'signUpOrLoginModal';

export enum SignUpOrLoginIntent {
  LINK_ACCOUNT,
  SIGN_IN,
  CREATE_ACCOUNT,
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
  imports: [
    MatDialogContent,
    ResizeMonitorDirective,
    MatProgressSpinner,
    MatButton,
    MatIcon,
    MatDivider,
    MatTabGroup,
    MatTab,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatSuffix,
    MatError,
    AsyncPipe,
  ],
})
export class SignUpOrLoginDialogComponent implements OnInit, OnDestroy {
  onSignUpWithGoogleClicked = new Subject<void>();
  onCreateAccountClicked = new Subject<void>();
  onSignInClicked = new Subject<void>();
  onSignUpWithMicrosoftClicked = new Subject<void>();

  screen: 'signIn' | 'signUp' = 'signUp';

  form = new FormGroup({
    name: new FormControl<string>('', {
      validators: [],
      nonNullable: true,
    }),
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
    private readonly route: ActivatedRoute,
    private readonly toastService: ToastService
  ) {
    this.intent = dialogData.intent;
    this.screen =
      dialogData.intent === SignUpOrLoginIntent.SIGN_IN ? 'signIn' : 'signUp';
  }

  ngOnInit() {
    this.authService.user.pipe(take(1)).subscribe(user => {
      if (user?.displayName) {
        this.form.patchValue({ name: user.displayName });
      }
    });

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
      .subscribe(success => {
        if (success) {
          this.dialogRef.close();
        }
      });

    this.onSignUpWithMicrosoftClicked
      .pipe(
        switchMap(() => {
          this.isBusy.next(true);
          this.errorMessage$.next('');
          if (this.intent === SignUpOrLoginIntent.LINK_ACCOUNT) {
            return this.linkAccountWithMicrosoft();
          } else {
            return this.signInWithMicrosoft();
          }
        }),
        tap(
          () => {} // this.analyticsService.logClickedSignUpWithMicrosoft('sign-in-dialog')
        ),
        takeUntil(this.destroy)
      )
      .subscribe(success => {
        if (success) {
          this.dialogRef.close();
        }
      });

    this.onSignInClicked
      .pipe(
        switchMap(() => {
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
            signInPromise = this.authService.signInWithEmailAndPassword(
              email,
              password
            );
          }
          return from(signInPromise).pipe(
            map(() => true),
            catchError(error => {
              this.isBusy.next(false);
              return this.handleAccountError(error);
            })
          );
        }),
        tap(() => this.analyticsService.logClickedSignIn('create')),
        takeUntil(this.destroy)
      )
      .subscribe(success => {
        if (success) {
          this.dialogRef.close();
        }
      });

    this.onCreateAccountClicked
      .pipe(
        switchMap(() => {
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
            signInPromise = this.authService.signUpWithEmailAndPassword(
              email,
              password,
              this.form.value.name
            );
          }
          return from(signInPromise).pipe(
            map(() => true),
            catchError(error => {
              this.isBusy.next(false);
              return this.handleAccountError(error);
            })
          );
        }),
        tap(() => this.analyticsService.logClickedSignIn('create')),
        takeUntil(this.destroy)
      )
      .subscribe(success => {
        if (success) {
          this.dialogRef.close();
        }
      });
  }

  async forgotPassword() {
    if (!this.form.controls.email.valid) {
      this.toastService.showMessage(
        'Please set your registered email in the form above to receive a password reset notification',
        undefined,
        'error'
      );
      return;
    }

    await this.authService.sendForgotPasswordEmail(this.form.value.email);
    this.toastService.showMessage(
      'Please check your emails for a password reset notification from us.'
    );
  }

  private linkAccountWithGoogle(): Observable<void | {}> {
    let signInPromise: Promise<void>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.linkAccountWithProviderInZoom('google');
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      signInPromise = this.teamsService
        .getGoogleOauthToken(returnTo)
        .then(token => {
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
      catchError(error => this.handleAccountError(error))
    );
  }

  private async linkAccountWithGoogleWeb(): Promise<void> {
    return this.authService.linkAccountWithGoogle();
  }

  private handleAccountError(error: any): Observable<boolean> {
    if (
      error.code === 'auth/credential-already-in-use' ||
      error.code === 'auth/email-already-in-use'
    ) {
      this.dialog.open(
        ...authProgressDialogCreator({
          initialState: AuthProgressState.ACCOUNT_EXISTS,
          startAccountSetupOnOpen: false,
        })
      );
      return of(false);
    } else {
      return this.handleUnknownAuthError(error);
    }
  }

  private handleUnknownAuthError(error: Error): Observable<boolean> {
    this.isBusy.next(false);
    console.error(error);
    this.errorMessage$.next(error.message);
    return of(false);
  }

  private async linkAccountWithProviderInZoom(provider: string): Promise<void> {
    this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: false,
      })
    );
    await this.zoomApiService.openUrl(
      this.authService.getApiAuthUrl(
        AuthIntent.LINK_ACCOUNT,
        provider
        // this.activatedRoute.snapshot.toString()
      ),
      true
    );

    // This promise never resolves, as the app will be reloaded on Auth success
    return new Promise(() => {});
  }

  private signInWithGoogle(): Observable<boolean> {
    let signInPromise: Promise<any>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.signInWithProviderInZoom('google');
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      signInPromise = this.teamsService
        .getGoogleOauthToken(returnTo)
        .then(token => {
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
      catchError(error => {
        return this.handleAccountError(error);
      })
    );
  }

  private signInWithGoogleWeb() {
    return this.authService.signInWithGoogle();
  }

  private signInWithProviderInZoom(provider: string) {
    this.dialog.open(
      ...authProgressDialogCreator({
        initialState: AuthProgressState.IN_PROGRESS,
        startAccountSetupOnOpen: false,
      })
    );
    return this.zoomApiService.openUrl(
      this.authService.getApiAuthUrl(AuthIntent.SIGN_IN, provider),
      true
    );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  private linkAccountWithMicrosoft(): Observable<void | {}> {
    let signInPromise: Promise<void>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.linkAccountWithProviderInZoom('microsoft');
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');

      signInPromise = this.teamsService
        .getMicrosoftAuthToken(returnTo)
        .then(token => {
          return this.authService.linkAccountWithMicrosoft(token);
        });
    } else {
      signInPromise = this.authService.linkAccountWithMicrosoft();
    }
    return from(signInPromise).pipe(
      tap(() => {
        this.isBusy.next(false);
      }),
      map(() => true),
      catchError(error => this.handleAccountError(error))
    );
  }

  private signInWithMicrosoft(): Observable<boolean> {
    let signInPromise: Promise<any>;
    if (this.config.runningIn === 'zoom') {
      signInPromise = this.signInWithProviderInZoom('microsoft');
    } else if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');

      signInPromise = this.teamsService
        .getMicrosoftAuthToken(returnTo)
        .then(token => {
          return this.authService.signInWithMicrosoft(token);
        });
    } else {
      signInPromise = this.authService.signInWithMicrosoft();
    }
    return from(signInPromise).pipe(
      tap(() => {
        this.isBusy.next(false);
      }),
      map(() => true),
      catchError(error => {
        return this.handleAccountError(error);
      })
    );
  }
}
