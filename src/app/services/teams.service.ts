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
      try {
        microsoftTeams.teamsCore.registerOnLoadHandler((data) => {
          try {
            microsoftTeams.app.notifySuccess();
          } catch {
            console.error('Could not notify success');
          }
        });
  
        microsoftTeams.teamsCore.registerBeforeUnloadHandler((readyToUnload) => {
          try {
            readyToUnload();
          } catch {
            console.error('Could not notify unload');
          }
          return true;
        });
      } catch {
        console.error('Could not register for cache');
      }
      

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
