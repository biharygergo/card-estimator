import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as microsoftTeams from '@microsoft/teams-js';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  isInitialized = false;

  constructor(private readonly router: Router) {}

  async configureApp() {
    if (!this.isInitialized) {
      await microsoftTeams.app.initialize();
      microsoftTeams.teamsCore.registerOnLoadHandler((data) => {

        if (data.contentUrl) {
          const url = new URL(data.contentUrl);
          this.router.navigateByUrl(url.pathname);
        }

        microsoftTeams.app.notifySuccess();
      });

      microsoftTeams.teamsCore.registerBeforeUnloadHandler((readyToUnload) => {
        readyToUnload();
        return true;
      });

      this.isInitialized = true;
    }
  }

  async inviteAllParticipants(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=teams&roomId=${roomId}`;
    microsoftTeams.pages.shareDeepLink({
      subPageId: roomId,
      subPageLabel: `Share this link to join room: ${roomId}`,
      subPageWebUrl: joinUrl,
    });
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
