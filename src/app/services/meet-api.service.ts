import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  AddonSession,
  meet,
  MeetSidePanelClient,
} from '@googleworkspace/meet-addons/meet.addons';

@Injectable({
  providedIn: 'root',
})
export class MeetApiService {
  loadedScript = false;
  loadedSession = false;

  sidePanelClient: MeetSidePanelClient = undefined;
  session: AddonSession = undefined;

  constructor() {}

  async configureApp(roomId?: string) {
    if (!this.loadedSession) {
      this.session = await meet.addon.createAddonSession({
        cloudProjectNumber: environment.cloudProjectNumber,
      });
      this.sidePanelClient = await this.session.createSidePanelClient();
      this.loadedSession = true;
    }
    if (roomId) {
      this.setCollaborationStartingState(roomId);
    }
  }

  async setCollaborationStartingState(roomId: string) {
    const startingState = await this.sidePanelClient.getActivityStartingState();
    if (!startingState.sidePanelUrl) {
      const joinUrl = `${window.location.origin}/join?s=meet&roomId=${roomId}`;
      await this.sidePanelClient.setActivityStartingState({
        sidePanelUrl: joinUrl,
      });
    }
  }

  async inviteAllParticipants(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=meet&roomId=${roomId}`;
    try {
      await this.sidePanelClient.startActivity({
        sidePanelUrl: joinUrl,
      });
    } catch (e) {
      if (e.message?.includes('activity is ongoing')) {
        return false;
      }
      throw e;
    }

    return true;
  }
}
