import { Component, inject } from '@angular/core';
import { PageHeaderWithCtaComponent } from '../components/page-header-with-cta/page-header-with-cta.component';
import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { integrationsModalCreator } from 'src/app/shared/integrations/integrations.component';

interface IntegrationRow {
  id: string;
  title: string;
  description: string;
  videoId: string;
  link?: string;
  isBigVideo?: boolean;
  hasAction?: boolean;
}

const VIDEO_CONFERENCING_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'teams',
    title: 'PlanningPoker.live for Microsoft Teams',
    description:
      'Install our planning poker plugin for Teams and estimate directly in your meeting window or chat tab. Used by hundreds of teams every day - this is our most popular plugin.',
    videoId: 'Integrations_Teams_1_ugiisk',
    link: '/integrations/teams',
  },
  {
    id: 'zoom',
    title: 'PlanningPoker.live for Zoom Meetings',
    description:
      'Run planning poker sessions in Zoom with our embedded app. Share it with your teammates with a single click and start estimating stories.',
    videoId: 'Integrations_Zoom_1_o1rqmg',
    link: '/integrations/zoom',
  },
  {
    id: 'meet',
    title: 'PlanningPoker.live for Google Meet',
    description:
      'Our newest plugin integrates directly with Google Meet. Estimate issues in your meeting sidebar and keep your team in sync.',
    videoId: 'Integrations_Meet_1_kzgimc',
    link: '/integrations/meet',
  },
  {
    id: 'webex',
    title: 'PlanningPoker.live for Webex Meetings',
    description:
      'Install our embedded app for Webex Meetings, the most convenient way to estimate stories for Webex users.',
    videoId: 'Integrations_Webex_1_1_roaiku',
    link: '/integrations/webex',
  },
];

const PROJECT_MANAGEMENT_INTEGRATIONS: IntegrationRow[] = [
  {
    id: 'jira',
    title: 'Estimate JIRA issues with PlanningPoker.live',
    description:
      'Connect your PlanningPoker.live account with JIRA to estimate issues directly from your backlog. Use advanced filters to import only the issues you need from your active sprint or project.',
    videoId: 'Jira_Optimized_2_tugns9',
    link: '/knowledge-base/how-to-estimate-jira-issues-with-planning-poker',
    isBigVideo: true,
  },
  {
    id: 'linear',
    title: 'Estimate Linear issues with PlanningPoker.live',
    description:
      'Running a team on Linear? Connect your account and estimate issues directly from your Linear board. Select issues directly from your recents or search for your most recent cycle to import.',
    videoId: 'Linear_Optimized_pu8atx',
    link: '/knowledge-base/estimate-linear-issues-planning-poker-live',
    isBigVideo: true,
  },
];

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [
    PageHeaderWithCtaComponent,
    NgOptimizedImage,
    MatButtonModule,
    RouterLink,
    NgTemplateOutlet,
  ],
  templateUrl: './integrations.component.html',
  styleUrl: './integrations.component.scss',
})
export class IntegrationsComponent {
  protected readonly videoConferencingIntegrations: IntegrationRow[] =
    VIDEO_CONFERENCING_INTEGRATIONS;
  protected readonly projectManagementIntegrations: IntegrationRow[] =
    PROJECT_MANAGEMENT_INTEGRATIONS;

  readonly dialog = inject(MatDialog)

  scrollTo(id: string) {
    const element = document.getElementById(id);
    const y = element.getBoundingClientRect().top + window.scrollY - 50;

    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  handleAction(id: string) {
    this.dialog.open(...integrationsModalCreator())
  }
}
