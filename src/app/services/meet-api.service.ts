import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AddonSession, MeetSidePanelClient } from 'src/types';

@Injectable()
export class MeetApiService {
  loadedScript = false;
  loadedSession = false;

  sidePanelClient: MeetSidePanelClient = undefined;
  session: AddonSession = undefined;

  constructor() {}

  async configureApp() {
    await this.loadScript();
    if (!this.loadedSession) {
      this.session = await window.meet.addon.createAddonSession({
        cloudProjectNumber: environment.cloudProjectNumber,
      });
      this.sidePanelClient = await this.session.createSidePanelClient();
      this.loadedSession = true;
    }
  }

  async inviteAllParticipants(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=meet&roomId=${roomId}`;
    await this.sidePanelClient.setCollaborationStartingState({
      sidePanelUrl: joinUrl,
    });
    return true;
  }

  loadScript() {
    return new Promise((resolve, reject) => {
      if (this.loadedScript) {
        resolve(true);
      } else {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src =
          'https://www.gstatic.com/meetjs/addons/0.1.0/meet.addons.js';

        script.onload = () => {
          this.loadedScript = true;
          resolve(true);
        };

        script.onerror = (error: any) => reject(error);

        document.getElementsByTagName('head')[0].appendChild(script);
      }
    });
  }
}
