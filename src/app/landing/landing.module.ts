import { CommonModule, provideCloudinaryLoader } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    data: {
      title: 'Planning Poker - Made for Remote Teams - SCRUM Poker',
      disablePostfix: true,
    },
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features/features.component').then(
        (mod) => mod.FeaturesComponent
      ),
    data: {
      title: 'Features',
      description:
        'Check out all the features available in our app. JIRA integration, customizable card sets and more.',
    },
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./faq/faq.component').then((mod) => mod.FaqComponent),
    data: {
      title: 'FAQ',
      description: 'All of our most frequently asked questions, answered.',
    },
  },
  {
    path: 'policies/privacy',
    loadComponent: () =>
      import('./privacy/privacy.component').then((mod) => mod.PrivacyComponent),
    data: { title: 'Privacy Policy' },
  },
  {
    path: 'policies/terms',
    loadComponent: () =>
      import('./terms/terms.component').then((mod) => mod.TermsComponent),
    data: { title: 'Terms and Conditions' },
  },
  {
    path: 'integrations/zoom',
    loadComponent: () =>
      import('./integrations/zoom/zoom.component').then(
        (mod) => mod.ZoomComponent
      ),
    data: {
      title: 'Planning Poker for Zoom Meetings',
      description:
        'Install our embedded app for Zoom Meetings, the most convenient way to estimate stories.',
      disablePostfix: true,
    },
  },
  {
    path: 'integrations/webex',
    loadComponent: () =>
      import('./integrations/webex/webex.component').then(
        (mod) => mod.WebexComponent
      ),
    data: {
      title: 'Planning Poker for Webex Meetings',
      disablePostfix: true,
      description:
        'Install our embedded app for Webex Meetings, the most convenient way to estimate stories.',
    },
  },
  {
    path: 'integrations/teams',
    loadComponent: () =>
      import('./integrations/teams/teams.component').then(
        (mod) => mod.TeamsComponent
      ),
    data: {
      title: 'Planning Poker for Microsoft Teams',
      disablePostfix: true,
      description:
        'Install our embedded app for Microsoft Teams, the most convenient way to estimate stories. Plugin made for Microsoft Teams.',
    },
  },
  {
    path: 'integrations/meet',
    loadComponent: () =>
      import('./integrations/meet/meet.component').then(
        (mod) => mod.MeetComponent
      ),
    data: {
      title: 'Planning Poker for Google Meet',
      disablePostfix: true,
      description:
        'Install our integration for Google Meet, the simplest way to estimate stories.',
    },
  },
  {
    path: 'integrations/slack',
    loadComponent: () =>
      import('./integrations/slack/slack.component').then(
        (mod) => mod.SlackComponent
      ),
    data: {
      title: 'Planning Poker for Slack',
      disablePostfix: true,
      description:
        'Integrate PlanningPoker.live with Slack and create rooms directly from your Slack channel.',
    },
  },
  {
    path: 'integrations/jira',
    loadComponent: () =>
      import('./integrations/jira/jira.component').then(
        (mod) => mod.JiraComponent
      ),
    data: {
      title: 'Estimate JIRA Issues with PlanningPoker.live',
      disablePostfix: true,
      description:
        'Connect your JIRA account with PlanningPoker.live to estimate issues directly from your backlog.',
    },
  },
  {
    path: 'integrations/linear',
    loadComponent: () =>
      import('./integrations/linear/linear.component').then(
        (mod) => mod.LinearComponent
      ),
    data: {
      title: 'Estimate Linear tickets with PlanningPoker.live',
      disablePostfix: true,
      description:
        'Connect your Linear account with PlanningPoker.live to estimate issues directly from your backlog.',
    },
  },
  {
    path: 'integrations',
    pathMatch: 'full',
    loadComponent: () =>
      import('./integrations/integrations.component').then(
        (mod) => mod.IntegrationsComponent
      ),
    data: {
      title: 'Integrations',
      description:
        'PlanningPoker.live integrates with your favorite tools. JIRA, Zoom, Microsoft Teams and more.',
    },
  },
  {
    path: 'organizationInvitation',
    loadComponent: () =>
      import(
        './organization-invitation/organization-invitation.component'
      ).then((mod) => mod.OrganizationInvitationComponent),
    data: { title: 'Organization invitation' },
  },
  {
    path: 'premium',
    redirectTo: '/pricing',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./premium/premium.component').then((mod) => mod.PremiumComponent),
    data: {
      title: 'Pricing',
      description:
        'Free monthly credits with our pay-as-you-go plan or unlimited with a subscription. No hidden fees.',
    },
  },
  {
    path: 'integration/:result',
    loadComponent: () =>
      import('./integration-result/integration-result.component').then(
        (mod) => mod.IntegrationResultComponent
      ),
    data: { title: 'Integration finished' },
  },
  {
    path: 'knowledge-base',
    loadChildren: () => import('./blog/blog.module').then((m) => m.BlogModule),
  },
  {
    path: 'tools/story-point-calculator',
    loadComponent: () =>
      import(
        './tools/story-point-calculator/story-point-calculator.component'
      ).then((m) => m.StoryPointCalculatorComponent),
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],
})
export class LandingModule {}
