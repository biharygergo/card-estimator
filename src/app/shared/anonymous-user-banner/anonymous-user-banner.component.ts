import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Subject, takeUntil, tap } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';

@Component({
  selector: 'anonymous-user-banner',
  templateUrl: './anonymous-user-banner.component.html',
  styleUrls: ['./anonymous-user-banner.component.scss'],
})
export class AnonymousUserBannerComponent implements OnInit {
  isBusy = new BehaviorSubject<boolean>(false);
  onSignUpClicked = new Subject<void>();
  onSignInClicked = new Subject<void>();
  destroy = new Subject<void>();

  user = this.authService.user;

  @Input() bannerStyle: 'default' | 'gray' = 'default';

  @Input() hideable: boolean;
  isHidden: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private readonly analyticsService: AnalyticsService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.onSignUpClicked
      .pipe(
        tap(() => {
          this.dialog.open(
            ...signUpOrLoginDialogCreator({
              intent: SignUpOrLoginIntent.LINK_ACCOUNT,
            })
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.onSignInClicked.pipe(takeUntil(this.destroy)).subscribe(() => {
      this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: SignUpOrLoginIntent.SIGN_IN,
        })
      );
    });
  }

  hideBanner() {
    this.isHidden = true;
  }
}
