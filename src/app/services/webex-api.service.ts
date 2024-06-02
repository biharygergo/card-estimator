import { Injectable } from '@angular/core';

@Injectable()
export class WebexApiService {
  loadedScript = false;

  app: any = undefined;

  constructor() {}

  async configureApp() {
    await this.loadScript();
    this.app = new (window as any).Webex.Application();
    await this.app.onReady();
  }

  async inviteAllParticipants(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=webex&roomId=${roomId}`;
    if (this.app.isShared) {
      return false;
    }
    await this.app.setShareUrl(joinUrl, "", "Planning Poker");
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
          'https://binaries.webex.com/static-content-pipeline/webex-embedded-app/v1/webex-embedded-app-sdk.js';

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
