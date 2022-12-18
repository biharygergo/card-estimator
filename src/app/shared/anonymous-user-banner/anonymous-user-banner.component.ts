import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { ActivatedRoute } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  from,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthIntent, AuthService } from 'src/app/services/auth.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../auth-progress-dialog/auth-progress-dialog.component';

@Component({
  selector: 'anonymous-user-banner',
  templateUrl: './anonymous-user-banner.component.html',
  styleUrls: ['./anonymous-user-banner.component.scss'],
})
export class AnonymousUserBannerComponent implements OnInit {
  isBusy = new BehaviorSubject<boolean>(false);
  onSignUpClicked = new Subject<void>();
  destroy = new Subject<void>();

  user = this.authService.user;

  @Input() bannerStyle: 'default' | 'gray' = 'default';

  constructor(
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    private readonly analyticsService: AnalyticsService,
    private readonly zoomApiService: ZoomApiService,
    private readonly dialog: MatDialog,
    private readonly activatedRoute: ActivatedRoute,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.onSignUpClicked
      .pipe(
        switchMap(async () => {
          this.isBusy.next(true);
          let signInPromise: Promise<void>;
          if (this.config.isRunningInZoom) {
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
            signInPromise = new Promise(() => {});
          } else {
            signInPromise = this.authService
              .linkAccountWithGoogle()
              .catch((error) => {
                if (error.code === 'auth/credential-already-in-use') {
                  this.dialog.open(
                    ...authProgressDialogCreator({
                      initialState: AuthProgressState.ACCOUNT_EXISTS,
                      startAccountSetupOnOpen: false,
                    })
                  );
                }
              });
          }
          return from(signInPromise).pipe(
            tap(() => {
              this.isBusy.next(false);
            }),
            catchError((error) => {
              this.isBusy.next(false);
              console.error('error here', error);
              this.snackBar.open(
                `Failed to link account with Google. The issue is: ${error.message}`,
                null,
                {
                  duration: 3000,
                  horizontalPosition: 'right',
                }
              );

              return of({});
            })
          );
        }),
        tap(() => {
          this.analyticsService.logClickedSignUpWithGoogle(
            this.bannerStyle === 'default' ? 'history' : 'profile-modal'
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }
}
