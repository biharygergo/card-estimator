import { Component, inject } from '@angular/core';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { integrationsModalCreator } from 'src/app/shared/integrations/integrations.component';
import { SlackService } from 'src/app/services/slack.service';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';

interface IntegrationRow {
  id: string;
  title: string;
  description: string;
  videoId: string;
  link?: string;
  isBigVideo?: boolean;
  is169Video?: boolean;
  hasAction?: boolean;
}

const VIDEO_CONFERENCING_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'teams',
    title: 'PlanningPoker.live for Microsoft Teams',
    description:
      'Install our planning poker plugin for Teams and estimate directly in your meeting window or chat tab. Used by hundreds of teams every day - this is our most popular plugin. Boost your agile estimation process with real-time story point voting and team collaboration features. Save valuable meeting time by keeping everyone focused in one window, while our intuitive interface helps reduce context switching and improves sprint planning efficiency.',
    videoId: 'Integrations_Teams_1_ugiisk',
    link: '/integrations/teams',
  },
  {
    id: 'zoom',
    title: 'PlanningPoker.live for Zoom Meetings',
    description:
      'Run planning poker sessions in Zoom with our embedded app. Share it with your teammates with a single click and start estimating stories. Seamlessly integrate agile estimation into your daily Zoom meetings without requiring additional tools or browser tabs. Experience enhanced team engagement and faster consensus building with our interactive voting system and real-time results visualization.',
    videoId: 'Integrations_Zoom_1_o1rqmg',
    link: '/integrations/zoom',
  },
  {
    id: 'meet',
    title: 'PlanningPoker.live for Google Meet',
    description:
      'Our newest plugin integrates directly with Google Meet. Estimate issues in your meeting sidebar and keep your team in sync. Perfect for remote agile teams using Google Workspace, enabling seamless story point estimation without leaving your meeting environment. Improve sprint planning productivity with instant voting results and built-in consensus tracking features.',
    videoId: 'Integrations_Meet_1_kzgimc',
    link: '/integrations/meet',
  },
  {
    id: 'webex',
    title: 'PlanningPoker.live for Webex Meetings',
    description:
      'Install our embedded app for Webex Meetings, the most convenient way to estimate stories for Webex users. Enhance your agile ceremonies with native Webex integration that feels like a natural part of your meeting experience. Streamline your scrum planning sessions with instant access to planning poker cards and real-time team voting visualization.',
    videoId: 'Integrations_Webex_1_1_roaiku',
    link: '/integrations/webex',
  },
];

const PROJECT_MANAGEMENT_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'jira',
    title: 'Estimate JIRA issues with PlanningPoker.live',
    description:
      'Connect your PlanningPoker.live account with JIRA to estimate issues directly from your backlog. Use advanced filters to import only the issues you need from your active sprint or project. Automatically sync story points back to JIRA, eliminating manual updates and reducing administrative overhead. Leverage our smart import feature to prioritize and estimate epics, stories, and tasks while maintaining your existing JIRA workflow.',
    videoId: 'Jira_Optimized_2_tugns9',
    link: '/integrations/jira',
    isBigVideo: true,
  },
  {
    id: 'linear',
    title: 'Estimate Linear issues with PlanningPoker.live',
    description:
      'Running a team on Linear? Connect your account and estimate issues directly from your Linear board. Select issues directly from your recents or search for your most recent cycle to import. Benefit from seamless two-way synchronization between Linear and PlanningPoker.live for real-time story point updates. Streamline your agile estimation process with our intelligent issue tracking integration and customizable voting schemes.',
    videoId: 'Linear_Optimized_pu8atx',
    link: '/integrations/linear',
    isBigVideo: true,
  },
];

const MESSAGING_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'slack',
    title: 'Start a planning poker session from Slack',
    description:
      'Use our simple Slack app to quickly create planning poker sessions right from your channel. Just type /create-room and share the generated link with your teammates. Save time by creating rooms without leaving Slack, perfect for teams who want to start estimation sessions with minimal setup.',
    videoId: 'Slackzoomed_hyi6xy',
    link: '/integrations/slack',
    hasAction: true,
    is169Video: true,
  },
];

@Component({
  selector: 'app-integrations',
  imports: [
    NgOptimizedImage,
    MatButtonModule,
    RouterLink,
    NgTemplateOutlet,
    StartPlanningCtaComponent,
  ],
  templateUrl: './integrations.component.html',
  styleUrl: './integrations.component.scss',
})
export class IntegrationsComponent {
  protected readonly videoConferencingIntegrations: IntegrationRow[] =
    VIDEO_CONFERENCING_INTEGRATIONS;
  protected readonly projectManagementIntegrations: IntegrationRow[] =
    PROJECT_MANAGEMENT_INTEGRATIONS;
  protected readonly messagingIntegrations: IntegrationRow[] =
    MESSAGING_INTEGRATIONS;

  readonly dialog = inject(MatDialog);
  readonly slackApiService = inject(SlackService);
  scrollTo(id: string) {
    const element = document.getElementById(id);
    const y = element.getBoundingClientRect().top + window.scrollY - 50;

    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  handleAction(id: string) {
    if (id === 'slack') {
      this.slackApiService.startSlackAuthFlow();
    }
  }
}
