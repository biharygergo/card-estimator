import { Component, inject } from '@angular/core';
import {
  IntegrationConfig,
  IntegrationPageTemplateComponent,
} from '../shared/integration-page-template/integration-page-template.component';
import { SlackService } from 'src/app/services/slack.service';

@Component({
  selector: 'app-slack',
  standalone: true,
  imports: [IntegrationPageTemplateComponent],
  templateUrl: './slack.component.html',
  styleUrl: './slack.component.scss',
})
export class SlackComponent {
  private readonly slackService = inject(SlackService);
  config: IntegrationConfig = {
    header: {
      title:
        'Estimate Stories Faster with the PlanningPoker.live Slack Integration',
      description:
        'Start planning poker sessions directly in Slack to keep your team aligned and productive—no extra tools required.',
      buttonLabel: 'Add to Slack',
      videoId: 'Slackzoomed_hyi6xy',
      aspectRatio: '1736/1080',
    },
    details: {
      description:
        'Integrate PlanningPoker.live with Slack to use the "/create-room" command in your channel to start a planning poker session. Invite your teammates with the click of a button to estimate stories and keep your team in sync.',
      steps: [
        {
          title:
            'Step 1: Add the PlanningPoker.live app to your Slack workspace',
          text: "Begin by clicking the 'Add to Slack' button at the top of this page. This will connect PlanningPoker.live to your Slack workspace, enabling your team to start planning poker sessions directly within Slack channels. Once added, the integration will prompt you to authorize the app, ensuring a secure connection for your workspace. The app only requires the minimum permissions to function.",
          imgId: 'slack-add-app',
          notAppScreenshot: true,
          alt: 'Slack add app screen',
          width: 2930,
          height: 1650
        },
        {
          title: 'Step 2: Start a planning poker session in your channel',
          text: 'After adding the PlanningPoker.live app to your Slack workspace, you can launch a session by typing /create-room in any Slack channel. The app will respond with an interactive message containing a \'Join Room\' button. Clicking this button will redirect you and your team to the PlanningPoker.live web app, where the session takes place. This seamless handoff allows your team to quickly transition from Slack to a full-featured estimation environment, keeping everyone aligned without unnecessary friction.',
          imgId: 'slack-create-room',
          alt: 'Slack create room command',
          width: 3164,
          height: 2062
        },
        {
          title: 'Step 3: The channel members join the room created',
          text: 'Once your teammates click the \'Join Room\' button, they’ll enter the PlanningPoker.live web app, where the session takes place. Team members can vote on story points, share insights, and collaborate to reach a consensus on estimates—all in a simple and intuitive interface designed for productive planning.',
          imgId: 'slack-invite',
          alt: 'Slack invite to room',
          width: 3164,
          height: 2062
        },
      ],
    },
    action: () => {
      this.slackService.startSlackAuthFlow();
    },
  };
}
