import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import zoomSdk from '@zoom/appssdk';

@Injectable({
  providedIn: 'root',
})
export class ZoomApiService {
  constructor(@Inject(APP_CONFIG) public config: AppConfig) {}

  configureApp() {
    if (!this.config.isRunningInZoom) {
      throw Error('Not running inside Zoom.');
    }
    return zoomSdk.config({
      popoutSize: { width: 480, height: 360 },
      capabilities: [
        'authorize',
        'promptAuthorize',
        'sendAppInvitationToAllParticipants',
        'expandApp',
      ],
    });
  }

  inviteAllParticipants(_roomId: string) {
    return zoomSdk.sendAppInvitationToAllParticipants();
  }
}
