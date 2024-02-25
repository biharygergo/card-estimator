import { Injectable } from '@angular/core';
import { MeetSidePanelClient } from 'src/types';

@Injectable({
  providedIn: 'root',
})
export class MeetApiService {
  loadedScript = false;

  sidePanelClient: MeetSidePanelClient = undefined;

  constructor() {}

  async configureApp() {
    await this.loadScript();
    const session = await window.meet.addon.createAddonSession({
      cloudProjectNumber: '615966905854', // TODO: Use environment variable for this
    });
    console.log('Successfully constructed the add-on session.');
    this.sidePanelClient = await session.createSidePanelClient();
    console.log('Successfully constructed side panel client.');
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
