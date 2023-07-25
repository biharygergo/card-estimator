import { Injectable } from '@angular/core';
import * as microsoftTeams from '@microsoft/teams-js';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  constructor() {}

  async configureApp() {
    return microsoftTeams.app.initialize();
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
    await microsoftTeams.app.initialize();

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
    microsoftTeams.authentication.notifySuccess(token)
  }
}
