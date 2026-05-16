import { Component, Inject, OnDestroy, OnInit, signal } from '@angular/core';
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
  firstValueFrom,
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
import { SocialAccountLinkService } from 'src/app/services/social-account-link.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../auth-progress-dialog/auth-progress-dialog.component';
import { deviceCodeDialogCreator } from '../device-code-dialog/device-code-dialog.component';
import { embedSsoLinkDialogCreator } from '../embed-sso-link-dialog/embed-sso-link-dialog.component';
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
import * as Sentry from '@sentry/angular';
import { isEmbeddedPlatform } from 'src/app/types';

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

function emailDomainFromAddress(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split('@');
  if (parts.length < 2 || parts[1].length === 0) {
    return null;
  }
  return parts[1];
}

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

  /** Expands to work email + “Continue with SSO” (lookup runs on submit only). */
  showSsoEmailPanel = signal(false);
  ssoFlowBusy = signal(false);
  ssoEmailControl = new FormControl<string>('', {
    validators: [Validators.required, Validators.email],
    nonNullable: true,
  });

  intent: SignUpOrLoginIntent;

  readonly SignUpOrLoginIntent = SignUpOrLoginIntent;
  constructor(
    private readonly authService: AuthService,
    private readonly socialAccountLink: SocialAccountLinkService,
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
            tap(() => this.isBusy.next(false)),
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
            tap(() => this.isBusy.next(false)),
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

  revealSsoEmailPanel(): void {
    this.showSsoEmailPanel.set(true);
  }

  async startEnterpriseSsoFromEmail(): Promise<void> {
    this.ssoEmailControl.markAllAsTouched();
    if (this.ssoEmailControl.invalid) {
      return;
    }
    const domain = emailDomainFromAddress(this.ssoEmailControl.value);
    if (!domain) {
      this.ssoEmailControl.setErrors({ invalidDomain: true });
      return;
    }

    this.ssoFlowBusy.set(true);
    this.errorMessage$.next('');
    try {
      const cfg = await this.authService.getSsoDomainConfig(domain);
      if (!cfg?.providerId) {
        this.toastService.showMessage(
          'No work SSO is set up for that email domain. Use Google, Microsoft, or email and password.',
          undefined,
          'error'
        );
        return;
      }

      const inEmbed = isEmbeddedPlatform(this.config.runningIn);
      if (inEmbed) {
        const ref = this.dialog.open(
          ...embedSsoLinkDialogCreator({
            ssoProviderId: cfg.providerId,
            ssoOrganizationId: cfg.organizationId,
            ssoOrganizationName: cfg.organizationName,
          })
        );
        const success = await firstValueFrom(ref.afterClosed());
        if (success === true) {
          this.dialogRef.close();
        }
        return;
      }

      const user = await this.authService.getUser();
      if (
        this.intent === SignUpOrLoginIntent.LINK_ACCOUNT &&
        user &&
        !user.isAnonymous
      ) {
        await this.authService.linkEnterpriseSso(
          cfg.providerId,
          cfg.organizationId
        );
      } else {
        await this.authService.signInWithEnterpriseSso(
          cfg.providerId,
          cfg.organizationId
        );
      }
      this.dialogRef.close();
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err.code === 'auth/account-exists-with-different-credential') {
        this.errorMessage$.next(
          'That email already has an account with a different sign-in method. Open planningpoker.live in a browser and use Join, or link work SSO from your profile after signing in.'
        );
      } else {
        console.error(e);
        this.errorMessage$.next(
          err.message ?? 'Work SSO could not be started. Please try again.'
        );
        Sentry.captureException(e);
      }
    } finally {
      this.ssoFlowBusy.set(false);
    }
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

  private linkAccountWithGoogle(): Observable<boolean> {
    return from(this.socialAccountLink.linkGoogle()).pipe(
      tap(() => {
        this.isBusy.next(false);
      }),
      map(() => true),
      catchError(error => this.handleAccountError(error))
    );
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
    Sentry.captureException(error);
    return of(false);
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

  private async signInWithProviderInZoom(provider: string) {
    await this.zoomApiService.openUrl(
      this.authService.getDeviceAuthUrl(AuthIntent.SIGN_IN, provider),
      true
    );

    const dialogRef = this.dialog.open(
      ...deviceCodeDialogCreator({
        authIntent: AuthIntent.SIGN_IN,
        provider,
      })
    );

    return new Promise<void>((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          resolve();
        } else {
          reject(new Error('Sign-in cancelled'));
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  private linkAccountWithMicrosoft(): Observable<boolean> {
    return from(this.socialAccountLink.linkMicrosoft()).pipe(
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
