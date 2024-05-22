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
import { PermissionsService } from 'src/app/services/permissions.service';
import { LinkService } from 'src/app/services/link.service';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { PaymentService } from 'src/app/services/payment.service';
import { pricingModalCreator } from '../pricing-table/pricing-table.component';
import { recurringMeetingsModalCreator } from '../recurring-meetings-modal/recurring-meetings-modal.component';

@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
})
export class ProfileDropdownComponent implements OnInit {
  currentUser = this.auth.user;

  isOnJoinOrCreateScreen$: Observable<boolean> = this.activeRoute.url.pipe(
    map((url) => {
      const paths = url.map((segment) => segment.path);
      return paths.includes('join') || paths.includes('create');
    })
  );

  constructor(
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    private analytics: AnalyticsService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly zoomService: ZoomApiService,
    private readonly activeRoute: ActivatedRoute,
    private readonly linkService: LinkService,
    public readonly permissionsService: PermissionsService,
    public readonly themeService: ThemeService,
    public readonly paymentService: PaymentService
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
    this.analytics.logClickedLearnMorePremium('profile_dropdown');
    this.dialog.open(...premiumLearnMoreModalCreator());
  }

  openPricingModal() {
    this.analytics.logClickedLearnMorePremium('profile_dropdown');
    this.dialog.open(...pricingModalCreator());
  }

  reportAnIssue() {
    const apiUrl = window.origin + '/api/reportAnIssue';
    this.linkService.openUrl(apiUrl);
    this.analytics.logClickedReportAnIssue('profile_icon');
  }

  toggleDarkMode() {
    this.themeService.setTheme(
      this.themeService.currentTheme === Theme.DARK ? Theme.DEFAULT : Theme.DARK
    );
  }

  openInBrowser() {
    const currentUrl = window.location.origin + window.location.pathname;
    this.linkService.openUrl(currentUrl);
  }

  openRecurringMeetingsModal() {
    this.dialog.open(...recurringMeetingsModalCreator());
  }
}
