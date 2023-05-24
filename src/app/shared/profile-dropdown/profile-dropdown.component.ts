import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { map, Observable } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { ZoomApiService } from 'src/app/services/zoom-api.service';
import { avatarModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { integrationsModalCreator } from '../integrations/integrations.component';
import { organizationModalCreator } from '../organization-modal/organization-modal.component';
import {
  SignUpOrLoginIntent,
  signUpOrLoginDialogCreator,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { premiumLearnMoreModalCreator } from '../premium-learn-more/premium-learn-more.component';

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
})
export class ProfileDropdownComponent implements OnInit {
  currentUser = this.auth.user;

  currentRoomId$: Observable<string | null> = this.activeRoute.paramMap.pipe(
    map((paramMap) => paramMap.get('roomId'))
  );

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService,
    private readonly activeRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {}

  async createAccount() {
    try {
      await this.auth.linkAccountWithGoogle();
    } catch (error) {
      this.snackBar.open(
        `Failed to link account with Google. The issue is: ${error.message}`,
        'OK',
        {
          duration: 3000,
        }
      );
    }
  }

  async unlinkAccount() {
    try {
      await this.auth.unlinkGoogleAccount();
    } catch (error) {
      this.snackBar.open(
        `Failed to unlink account with Google. The issue is: ${error.message}`,
        'OK',
        {
          duration: 3000,
        }
      );
    }
  }

  openAvatarSelector() {
    this.dialog.open(...avatarModalCreator({}));
    this.analytics.logClickedEditAvatar('profile_icon');
  }

  openOrganizationModal() {
    this.dialog.open(...organizationModalCreator());
    this.analytics.logClickedOpenOrganizationModal('profile_icon');
  }

  openIntegrationsModal() {
    this.dialog.open(...integrationsModalCreator());
  }

  openCreateAccountModal() {
    this.dialog.open(
      ...signUpOrLoginDialogCreator({ intent: SignUpOrLoginIntent.SIGN_IN })
    );
  }

  openPremiumLearnMoreModal() {
    this.dialog.open(...premiumLearnMoreModalCreator());
  }

  reportAnIssue() {
    const apiUrl = window.origin + '/api/reportAnIssue';
    if (this.config.isRunningInZoom) {
      this.zoomService.openUrl(apiUrl, true);
    } else {
      window.open(apiUrl);
    }
    this.analytics.logClickedReportAnIssue('profile_icon');
  }
}
