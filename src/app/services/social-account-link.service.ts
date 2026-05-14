import { Inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { deviceCodeDialogCreator } from '../shared/device-code-dialog/device-code-dialog.component';
import { AuthIntent, AuthService } from './auth.service';
import { TeamsService } from './teams.service';
import { ZoomApiService } from './zoom-api.service';

/**
 * Link Google or Microsoft to the current Firebase user, using the same
 * paths as the sign-in dialog: Zoom device-code flow, Teams token exchange, or web popup.
 */
@Injectable({
  providedIn: 'root',
})
export class SocialAccountLinkService {
  constructor(
    private readonly auth: AuthService,
    private readonly zoomApi: ZoomApiService,
    private readonly teams: TeamsService,
    private readonly dialog: MatDialog,
    private readonly route: ActivatedRoute,
    @Inject(APP_CONFIG) private readonly config: AppConfig
  ) {}

  async linkGoogle(): Promise<void> {
    if (this.config.runningIn === 'zoom') {
      await this.runZoomDeviceLinkFlow('google');
      return;
    }
    if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      const token = await this.teams.getGoogleOauthToken(returnTo);
      await this.auth.linkAccountWithGoogle(token);
      return;
    }
    await this.auth.linkAccountWithGoogle();
  }

  async linkMicrosoft(): Promise<void> {
    if (this.config.runningIn === 'zoom') {
      await this.runZoomDeviceLinkFlow('microsoft');
      return;
    }
    if (this.config.runningIn === 'teams') {
      const returnTo = this.route.snapshot.url.join('/');
      const token = await this.teams.getMicrosoftAuthToken(returnTo);
      await this.auth.linkAccountWithMicrosoft(token);
      return;
    }
    await this.auth.linkAccountWithMicrosoft();
  }

  private async runZoomDeviceLinkFlow(
    provider: 'google' | 'microsoft'
  ): Promise<void> {
    await this.zoomApi.openUrl(
      this.auth.getDeviceAuthUrl(AuthIntent.LINK_ACCOUNT, provider),
      true
    );
    const dialogRef = this.dialog.open(
      ...deviceCodeDialogCreator({
        authIntent: AuthIntent.LINK_ACCOUNT,
        provider,
      })
    );
    const result = await firstValueFrom(dialogRef.afterClosed());
    if (!result) {
      throw new Error('Account linking cancelled');
    }
  }
}
