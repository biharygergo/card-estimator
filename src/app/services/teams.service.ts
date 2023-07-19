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
}
