import { Injectable, Inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AppConfig, APP_CONFIG } from '../app-config.module';
import { ZoomApiService } from './zoom-api.service';
import { WebexApiService } from './webex-api.service';
import { TeamsService } from './teams.service';
import { MeetApiService } from './meet-api.service';
import { EstimatorService } from './estimator.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from './toast.service';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { AnalyticsService } from './analytics.service';

export interface ShareRoomAction {
  type: 'interactive' | 'static';
  label: string;
  icon: string;
  action: () => Observable<string>;
  tooltip?: string;
}

export interface InstallLink {
  name: string;
  url: string;
  icon: string;
}

export interface ShareRoomLinks {
  platformName: string;
  platformIcon: string;
  actions: ShareRoomAction[];
  installLink?: string;
  installLinks?: InstallLink[];
}

@Injectable({
  providedIn: 'root',
})
export class IntegrationsService {
  constructor(
    @Inject(APP_CONFIG) private config: AppConfig,
    private zoomService: ZoomApiService,
    private webexService: WebexApiService,
    private teamsService: TeamsService,
    private meetService: MeetApiService,
    private estimatorService: EstimatorService,
    private clipboard: Clipboard,
    private toastService: ToastService,
    private confirmDialogService: ConfirmDialogService,
    private analytics: AnalyticsService
  ) {}

  getShareRoomLinks(roomId: string): Observable<ShareRoomLinks> {
    const host = window.origin || 'https://card-estimator.web.app';
    const roomUrl = `${host}/join?roomId=${roomId}`;

    switch (this.config.runningIn) {
      case 'zoom':
        return this.getZoomShareLinks(roomId, roomUrl);
      case 'webex':
        return this.getWebexShareLinks(roomId, roomUrl);
      case 'teams':
        return this.getTeamsShareLinks(roomId, roomUrl);
      case 'meet':
        return this.getMeetShareLinks(roomId, roomUrl);
      case 'web':
        return this.getWebShareLinks(roomId, roomUrl);
      default:
        return of({
          platformName: 'Web',
          platformIcon: 'language',
          actions: [
            {
              type: 'static',
              label: 'Copy room URL',
              icon: 'content_copy',
              action: () => {
                this.clipboard.copy(roomUrl);
                return of('Join link copied to clipboard.');
              },
              tooltip: 'Copy room URL',
            },
          ],
        });
    }
  }

  private getZoomShareLinks(roomId: string, roomUrl: string): Observable<ShareRoomLinks> {
    return of({
      platformName: 'Zoom',
      platformIcon: 'video_camera_front',
      actions: [
        {
          type: 'interactive',
          label: 'Invite all participants',
          icon: 'group_add',
          action: () => this.inviteZoomParticipants(roomId),
        },
        {
          type: 'static',
          label: 'Get install link',
          icon: 'link',
          action: () => {
            this.clipboard.copy('https://marketplace.zoom.us/zoomapp/s3ZCqVaZR9yPN_iKGW_6MQ/context/meeting/target/launch/deeplink');
            return of('Install link copied to clipboard.');
          },
          tooltip: 'Get install link',
        },
      ],
      installLink: 'https://marketplace.zoom.us/zoomapp/s3ZCqVaZR9yPN_iKGW_6MQ/context/meeting/target/launch/deeplink',
    });
  }

  private getWebexShareLinks(roomId: string, roomUrl: string): Observable<ShareRoomLinks> {
    return of({
      platformName: 'Webex',
      platformIcon: 'video_camera_front',
      actions: [
        {
          type: 'interactive',
          label: 'Invite participants',
          icon: 'group_add',
          action: () => this.inviteWebexParticipants(roomId, roomUrl),
        },
        {
          type: 'static',
          label: 'Get install link',
          icon: 'link',
          action: () => {
            this.clipboard.copy('https://apphub.webex.com/applications/planning-poker-planningpoker-live');
            return of('Install link copied to clipboard.');
          },
          tooltip: 'Get install link',
        },
      ],
      installLink: 'https://apphub.webex.com/applications/planning-poker-planningpoker-live',
    });
  }

  private getTeamsShareLinks(roomId: string, roomUrl: string): Observable<ShareRoomLinks> {
    return from(this.teamsService.canShareToStage()).pipe(
      switchMap(canShareToStage => {
        const actions: ShareRoomAction[] = [];

        if (canShareToStage) {
          actions.push({
            type: 'interactive',
            label: 'Share to Meeting Stage',
            icon: 'present_to_all',
            action: () => from(this.shareToTeamsStage(roomId)),
          });
        }

        actions.push({
          type: 'static',
          label: 'Copy Teams link',
          icon: 'content_copy',
          action: () => {
            return from(this.copyTeamsLink(roomId));
          },
          tooltip: 'Copy Teams link',
        });

        return of({
          platformName: 'Microsoft Teams',
          platformIcon: 'microsoft',
          actions,
          installLink: 'https://teams.microsoft.com/l/app/609fe794-87f9-4045-9ca7-0f79cc734930',
        });
      })
    );
  }

  private getMeetShareLinks(roomId: string, roomUrl: string): Observable<ShareRoomLinks> {
    return of({
      platformName: 'Google Meet',
      platformIcon: 'video_camera_front',
      actions: [
        {
          type: 'interactive',
          label: 'Start activity',
          icon: 'play_arrow',
          action: () => this.startMeetActivity(roomId),
        },
        {
          type: 'static',
          label: 'Get install link',
          icon: 'link',
          action: () => {
            this.clipboard.copy('https://workspace.google.com/marketplace/app/planningpokerlive/417578634660');
            return of('Install link copied to clipboard.');
          },
          tooltip: 'Get install link',
        },
      ],
      installLink: 'https://workspace.google.com/marketplace/app/planningpokerlive/417578634660',
    });
  }

  private getWebShareLinks(roomId: string, roomUrl: string): Observable<ShareRoomLinks> {
    return of({
      platformName: 'Web',
      platformIcon: 'language',
      actions: [
        {
          type: 'static',
          label: 'Copy room URL',
          icon: 'content_copy',
          action: () => {
            this.clipboard.copy(roomUrl);
            return of('Join link copied to clipboard.');
          },
          tooltip: 'Copy room URL',
        },
      ],
      installLinks: [
        {
          name: 'Teams',
          url: 'https://teams.microsoft.com/l/app/609fe794-87f9-4045-9ca7-0f79cc734930',
          icon: '/assets/teams_logo.png',
        },
        {
          name: 'Zoom',
          url: 'https://marketplace.zoom.us/zoomapp/s3ZCqVaZR9yPN_iKGW_6MQ/context/meeting/target/launch/deeplink',
          icon: '/assets/zoom-logo.png',
        },
        {
          name: 'Meet',
          url: 'https://workspace.google.com/marketplace/app/planningpokerlive/417578634660',
          icon: '/assets/meet_logo.png',
        },
        {
          name: 'Webex',
          url: 'https://apphub.webex.com/applications/planning-poker-planningpoker-live',
          icon: '/assets/webex_logo.png',
        },
      ],
    });
  }

  private async shareToTeamsStage(roomId: string): Promise<string> {
    this.analytics.logClickedShareRoom('main');
    
    const shouldShareToStage = await this.confirmDialogService.openConfirmationDialog({
      title: 'Share to stage or copy link?',
      content:
        'You can either share the app to the meeting stage or copy the current room ID and send it to your colleagues yourself in chat. Which would you like to do?',
      positiveText: 'Share to Meeting Stage',
      negativeText: 'Copy room ID',
    });

    if (shouldShareToStage) {
      const isSharingToStage = await this.teamsService.shareAppContentToStage(roomId);
      if (isSharingToStage) {
        this.analytics.logSharedToStage();
        return '🎉 Started sharing app to meeting stage for all meeting participants. You can close this side-panel.';
      }
    }

    const link = await this.teamsService.getDeepLink(roomId);
    this.clipboard.copy(link);
    return 'Join link copied, share it in the chat so others can join this room.';
  }

  private async copyTeamsLink(roomId: string): Promise<string> {
    const link = await this.teamsService.getDeepLink(roomId);
    this.clipboard.copy(link);
    return 'Teams link copied to clipboard!';
  }

  private inviteZoomParticipants(roomId: string): Observable<string> {
    return from(this.zoomService.inviteAllParticipants(roomId)).pipe(
      map(({ invitationUUID }) => {
        this.estimatorService.saveInvitation(invitationUUID, roomId);
        return 'Invitation sent to all participants!';
      })
    );
  }

  private inviteWebexParticipants(roomId: string, roomUrl: string): Observable<string> {
    return from(this.webexService.inviteAllParticipants(roomId)).pipe(
      map(shareSessionStarted => {
        if (!shareSessionStarted) {
          this.clipboard.copy(roomUrl);
        }
        return shareSessionStarted
          ? 'All ready, click the "Open for all" button below! ⬇️'
          : 'Join link copied to clipboard for non-Webex participants.';
      })
    );
  }

  private startMeetActivity(roomId: string): Observable<string> {
    return from(this.meetService.inviteAllParticipants(roomId)).pipe(
      map(success => 
        success
          ? 'Activity started, the app will open for everyone in the meeting. 🎉'
          : 'An activity is already ongoing.'
      )
    );
  }
} 