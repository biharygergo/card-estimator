import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as microsoftTeams from '@microsoft/teams-js';
import { Theme, ThemeService } from './theme.service';
import { PaymentService } from './payment.service';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  isInitialized = false;

  constructor(
    private readonly router: Router,
    private readonly themeService: ThemeService,
    private readonly paymentService: PaymentService
  ) {}

  async configureApp() {
    if (!this.isInitialized) {
      await microsoftTeams.app.initialize();
      const frameContext = microsoftTeams.app.getFrameContext();
      const appContext = await microsoftTeams.app.getContext();

      if (
        ['android', 'ios', 'ipados'].includes(appContext.app.host.clientType)
      ) {
        this.paymentService.isSubscriptionDisabled = true;
      }

      if (frameContext === 'sidePanel' || frameContext === 'meetingStage') {
        this.themeService.setTheme(Theme.DARK);
      }

      try {
        microsoftTeams.teamsCore.registerOnLoadHandler((data) => {
          console.log(data.contentUrl);
          try {
            microsoftTeams.app.notifySuccess();
          } catch {
            console.error('Could not notify success');
          }
        });

        microsoftTeams.teamsCore.registerBeforeUnloadHandler(
          (readyToUnload) => {
            try {
              readyToUnload();
            } catch {
              console.error('Could not notify unload');
            }
            return true;
          }
        );
      } catch {
        console.error('Could not register for cache');
      }

      this.isInitialized = true;
    }
  }

  async inviteAllParticipants(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=teams&roomId=${roomId}`;
    const context = await microsoftTeams.app.getContext();

    const linkContext = `{"chatId":"${context.chat?.id}","contextType":"chat"}`;
    const deepLink = `https://teams.microsoft.com/l/entity/609fe794-87f9-4045-9ca7-0f79cc734930/create_a_room?webUrl=${joinUrl}&context=${linkContext}&openInMeeting=true`;

    return deepLink;
  }

  async getGoogleOauthToken(returnTo: string): Promise<string> {
    await this.configureApp();

    const apiUrl = `${
      window.location.origin
    }/api/startTeamsGoogleAuth?oauthRedirectMethod={oauthRedirectMethod}&authId={authId}&redirectTo=${encodeURIComponent(
      returnTo
    )}`;
    microsoftTeams.authentication;
    const token = await microsoftTeams.authentication.authenticate({
      url: apiUrl,
      isExternal: true,
    });

    return token;
  }

  notifySuccess(token: string) {
    microsoftTeams.authentication.notifySuccess(token);
  }
}
