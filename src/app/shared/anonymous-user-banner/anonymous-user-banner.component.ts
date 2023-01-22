import { Component, Inject, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Subject, takeUntil, tap } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import {
  ConfigService,
  HIDE_PERMANENT_ACCOUNT_BANNER_KEY,
} from 'src/app/services/config.service';
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
  destroy = new Subject<void>();

  user = this.authService.user;

  @Input() bannerStyle: 'default' | 'gray' = 'default';

  @Input() hideable: boolean;
  isHidden: boolean = !!this.configService.getCookie(
    HIDE_PERMANENT_ACCOUNT_BANNER_KEY
  );

  constructor(
    private readonly authService: AuthService,
    private readonly analyticsService: AnalyticsService,
    private readonly dialog: MatDialog,
    private readonly configService: ConfigService,
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
          this.analyticsService.logClickedSignUpWithGoogle(
            this.bannerStyle === 'default' ? 'history' : 'profile-modal'
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  hideBanner() {
    this.isHidden = true;
    this.configService.setCookie(HIDE_PERMANENT_ACCOUNT_BANNER_KEY, 'true', 30);
  }
}
