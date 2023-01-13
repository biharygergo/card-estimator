import { Inject, Injectable } from '@angular/core';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import zoomSdk from '@zoom/appssdk';
import { BehaviorSubject } from 'rxjs';

type ZoomAuthenticationStatus =
  | 'authorized'
  | 'unauthorized'
  | 'unauthenticated'
  | 'authenticated';

@Injectable({
  providedIn: 'root',
})
export class ZoomApiService {
  constructor(@Inject(APP_CONFIG) public config: AppConfig) {}

  isAuthorized = new BehaviorSubject<boolean>(false);
  userContextStatus = new BehaviorSubject<ZoomAuthenticationStatus>(
    'unauthenticated'
  );
  isInGuestMode = new BehaviorSubject<boolean>(true);

  async configureApp() {
    if (!this.config.isRunningInZoom) {
      throw Error('Not running inside Zoom.');
    }
    const configResponse = await zoomSdk.config({
      popoutSize: { width: 480, height: 360 },
      capabilities: [
        'authorize',
        'promptAuthorize',
        'sendAppInvitationToAllParticipants',
        'expandApp',
        'onMyUserContextChange',
        'openUrl'
      ],
    });

    this.userContextStatus.next(configResponse.auth?.status);
    if (configResponse.auth?.status === 'authorized') {
      this.isInGuestMode.next(false);
    }

    return configResponse;
  }

  setAuthenticationListeners() {
    console.log('In-Client OAuth flow: onAuthorized event listener added');
    zoomSdk.addEventListener('onAuthorized', (event) => {
      const { code } = event;
      console.log('3. onAuthorized event fired.');
      console.log(
        '3a. Here is the event passed to event listener callback, with code and state: ',
        event
      );
      console.log(
        '4. POST the code, state to backend to exchange server-side for a token.  Refer to backend logs now . . .'
      );

      fetch('/api/inClientOnAuthorized', {
        method: 'POST',
        body: JSON.stringify({
          code,
          href: window.location.href,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(() => {
        console.log(
          '4. Backend returns succesfully after exchanging code for auth token.  Go ahead and update the UI'
        );
        this.isAuthorized.next(true);
      });
    });

    zoomSdk.addEventListener('onMyUserContextChange', (event) => {
      console.log('onMyUserContextChange', event);
      this.userContextStatus.next(event.status);
      if (event.status === 'authorized') {
        this.isInGuestMode.next(false);
      } else {
        this.isInGuestMode.next(true);
      }
    });
  }

  async promptAuthorize() {
    try {
      const promptAuthResponse = await zoomSdk.promptAuthorize();
      console.log(promptAuthResponse);
    } catch (e) {
      console.error(e);
    }
  }

  async authorize() {
    console.log('1. Get code challenge and state from backend . . .');
    let codeChallengeResponse: { codeChallenge: string } | undefined;
    try {
      codeChallengeResponse = await fetch('/api/generateCodeChallenge').then(
        (data) => data.json()
      );
      console.log(codeChallengeResponse);
      if (!codeChallengeResponse || codeChallengeResponse.codeChallenge) {
        console.error(
          'Error in the authorize flow - likely an outdated user session.  Please refresh the app'
        );
        return;
      }
    } catch (e) {
      console.error(e);
    }

    const { codeChallenge } = codeChallengeResponse;

    console.log('1a. Code challenge from backend: ', codeChallenge);

    const authorizeOptions = {
      codeChallenge: codeChallenge,
    };
    console.log('2. Invoke authorize, eg zoomSdk.authorize(authorizeOptions)');
    try {
      const zoomAuthResponse = await zoomSdk.authorize(authorizeOptions);
      console.log(zoomAuthResponse);
    } catch (e) {
      console.error(e);
    }
  }

  inviteAllParticipants(_roomId: string) {
    if (this.isInGuestMode.value) {
      this.promptAuthorize();
    } else {
      return zoomSdk.sendAppInvitationToAllParticipants();
    }
  }

  async openUrl(url: string, initialize?: boolean) {
    if (initialize) {
      await this.configureApp();
    }
    return zoomSdk.openUrl({
      url,
    });
  }
}
