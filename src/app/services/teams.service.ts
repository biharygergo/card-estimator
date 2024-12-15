import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Theme, ThemeService } from './theme.service';
import { PaymentService } from './payment.service';

@Injectable({
  providedIn: 'root',
})
export class TeamsService {
  isInitialized = false;
  microsoftTeams: any;

  constructor(
    private readonly router: Router,
    private readonly themeService: ThemeService,
    private readonly paymentService: PaymentService
  ) {}

  private async loadSdk(): Promise<void> {
    this.microsoftTeams = await import('@microsoft/teams-js');
  }

  async configureApp() {
    if (!this.isInitialized) {
      await this.loadSdk();
      await this.microsoftTeams.app.initialize();
      const frameContext = this.microsoftTeams.app.getFrameContext();
      const appContext = await this.microsoftTeams.app.getContext();

      if (
        ['android', 'ios', 'ipados'].includes(appContext.app.host.clientType)
      ) {
        this.paymentService.isSubscriptionDisabled.set(true);
      }

      if (frameContext === 'sidePanel' || frameContext === 'meetingStage') {
        this.themeService.setTheme(Theme.DARK);
      }

      try {
        this.microsoftTeams.teamsCore.registerOnLoadHandler((data) => {
          try {
            this.microsoftTeams.app.notifySuccess();
          } catch {
            console.error('Could not notify success');
          }
        });

        this.microsoftTeams.teamsCore.registerBeforeUnloadHandler(
          (readyToUnload) => {
            try {
              readyToUnload();
            } catch {
              console.error('Could not notify unload');
            }
            return true;
          }
        );
      } catch {
        console.error('Could not register for cache');
      }

      this.isInitialized = true;
    }
  }

  async shareAppContentToStage(roomId: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const canShareToStage = await this.canShareToStage();

      if (!canShareToStage) {
        resolve(false);
        return;
      }

      const roomUrl = `${window.location.origin}/room/${roomId}?s=teams`;
      this.microsoftTeams.meeting.shareAppContentToStage((err, result) => {
        if (result) {
          resolve(true);
        }

        if (err) {
          console.error(err);
          resolve(false);
        }
      }, roomUrl);
    });
  }

  async canShareToStage() {
    return new Promise((resolve) => {
      const frameContext = this.microsoftTeams.app.getFrameContext();
      const isInMeeting =
        frameContext === 'sidePanel' || frameContext === 'meetingStage';

      if (!isInMeeting) {
        resolve(false);
        return;
      }

      this.microsoftTeams.meeting.getAppContentStageSharingCapabilities(
        (err, result) => {
          if (result?.doesAppHaveSharePermission) {
            resolve(true);
            return;
          }

          resolve(false);
          return;
        }
      );
    });
  }

  async getDeepLink(roomId: string) {
    const joinUrl = `${window.location.origin}/join?s=teams&roomId=${roomId}`;
    const context = await this.microsoftTeams.app.getContext();
    const isRunningInMeeting = !!context.meeting?.id;
    const linkContext = {
      subEntityId: roomId,
    };
    if (context.chat?.id) {
      linkContext['chatId'] = context.chat.id;
      linkContext['contextType'] = 'chat';
    } else if (context?.channel?.id) {
      linkContext['channelId'] = context.channel.id;
    }
    const deepLink = `https://teams.microsoft.com/l/entity/609fe794-87f9-4045-9ca7-0f79cc734930/create_a_room?webUrl=${joinUrl}&context=${encodeURIComponent(
      JSON.stringify(linkContext)
    )}`;

    return deepLink;
  }

  async getLinkedRoomId(): Promise<string | undefined> {
    const context = await this.microsoftTeams.app.getContext();
    return context.page.subPageId;
  }

  async getGoogleOauthToken(returnTo: string): Promise<string> {
    await this.configureApp();

    const apiUrl = `${
      window.location.origin
    }/api/startOAuth?oauthRedirectMethod={oauthRedirectMethod}&authId={authId}&redirectTo=${encodeURIComponent(
      returnTo
    )}&platform=teams&provider=google`;
    const token = await this.microsoftTeams.authentication.authenticate({
      url: apiUrl,
      isExternal: true,
    });

    return token;
  }

  notifySuccess(token: string) {
    this.microsoftTeams.authentication.notifySuccess(token);
  }

  async getMicrosoftAuthToken(returnTo: string): Promise<string> {
    await this.configureApp();

    const apiUrl = `${
      window.location.origin
    }/api/startOAuth?oauthRedirectMethod={oauthRedirectMethod}&authId={authId}&redirectTo=${encodeURIComponent(
      returnTo
    )}&platform=teams&provider=microsoft`;
    const token = await this.microsoftTeams.authentication.authenticate({
      url: apiUrl,
      isExternal: true,
    });

    return token;
  }
}
