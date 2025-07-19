import { CommonModule, provideCloudinaryLoader } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(mod => mod.HomeComponent),
    data: {
      title: 'Planning Poker – The #1 Agile Estimation Tool for Remote Teams',
      description:
        'Looking for the best planning poker tool? Get real-time estimates, seamless Jira/Linear integration, and anonymous voting—no sign-up required! Try it now.',
      disablePostfix: true,
    },
  },
  {
    path: 'features',
    loadComponent: () =>
      import('./features/features.component').then(
        mod => mod.FeaturesComponent
      ),
    data: {
      title: 'Unlock Powerful Planning Poker Features (JIRA, Teams & More)',
      description:
        'Discover game-changing Planning Poker features—custom card sets, JIRA integration, video conferencing & more. See what’s inside!',
    },
  },
  {
    path: 'faq',
    loadComponent: () =>
      import('./faq/faq.component').then(mod => mod.FaqComponent),
    data: {
      title: 'Got Questions? Here’s Everything About Planning Poker',
      description:
        'Confused about how Planning Poker works? Get answers to the most frequently asked questions in one place.',
      disablePostfix: true,
    },
  },
  {
    path: 'policies/privacy',
    loadComponent: () =>
      import('./privacy/privacy.component').then(mod => mod.PrivacyComponent),
    data: {
      title: 'Privacy Policy - Your Data, Your Control',
      description:
        'We take your privacy seriously. Learn how your data is collected, stored, and protected at PlanningPoker.live.',
    },
  },
  {
    path: 'policies/terms',
    loadComponent: () =>
      import('./terms/terms.component').then(mod => mod.TermsComponent),
    data: {
      title: 'Terms & Conditions - Using PlanningPoker.live',
      description:
        'Understand the rules, policies, and user agreements for using PlanningPoker.live. Stay informed before you start.',
    },
  },
  {
    path: 'integrations/zoom',
    loadComponent: () =>
      import('./integrations/zoom/zoom.component').then(
        mod => mod.ZoomComponent
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
        mod => mod.WebexComponent
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
        mod => mod.TeamsComponent
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
        mod => mod.MeetComponent
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
        mod => mod.SlackComponent
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
        mod => mod.JiraComponent
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
        mod => mod.LinearComponent
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
        mod => mod.IntegrationsComponent
      ),
    data: {
      title: 'Planning Poker Integrations: JIRA, Linear, Zoom, Teams & More',
      description:
        'Seamlessly integrate PlanningPoker.live with JIRA, Zoom, Microsoft Teams, and more. Improve sprint planning with one-click integrations.',
    },
  },
  {
    path: 'organizationInvitation',
    loadComponent: () =>
      import(
        './organization-invitation/organization-invitation.component'
      ).then(mod => mod.OrganizationInvitationComponent),
    data: { title: 'Organization invitation', noIndex: true },
  },
  {
    path: 'premium',
    redirectTo: '/pricing',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./premium/premium.component').then(mod => mod.PremiumComponent),
    data: {
      title: 'Planning Poker Pricing: Simple, No Hidden Fees (See Plans)',
      disablePostfix: true,
      description:
        'Get free monthly credits or go unlimited with a subscription. See the full pricing breakdown—no hidden charges.',
    },
  },
  {
    path: 'integration/:result',
    loadComponent: () =>
      import('./integration-result/integration-result.component').then(
        mod => mod.IntegrationResultComponent
      ),
    data: { title: 'Integration finished' },
  },
  {
    path: 'knowledge-base',
    loadChildren: () => import('./blog/blog.module').then(m => m.BlogModule),
  },
  {
    path: 'printable-planning-poker-cards',
    loadComponent: () =>
      import(
        './printable-planning-poker-cards/printable-planning-poker-cards.component'
      ).then(m => m.PrintablePlanningPokerCardsComponent),
    data: {
      title: 'Free Printable Planning Poker Cards',
      description:
        'Get your free, professionally designed planning poker cards for agile estimation sessions. Perfect for teams who prefer physical cards or need a backup for in-person meetings.',
    },
  },
  {
    path: 'getting-started',
    loadComponent: () =>
      import('./getting-started/getting-started.component').then(
        m => m.GettingStartedComponent
      ),
    data: {
      title: 'Getting Started with PlanningPoker.live - Complete Tutorial Guide',
      description:
        'Learn how to use PlanningPoker.live with our comprehensive getting started guide. Step-by-step tutorial for running your first planning poker session.',
    },
  },
  {
    path: 'what-is-planning-poker',
    loadComponent: () =>
      import('./what-is-planning-poker/what-is-planning-poker.component').then(
        m => m.WhatIsPlanningPokerComponent
      ),
    data: {
      title: 'What is Planning Poker?',
      description:
        'Learn how Planning Poker works and why it is a great tool for agile teams.',
    },
  },
  {
    path: 'estimation-techniques-comparison',
    loadComponent: () =>
      import('./estimation-techniques-comparison/estimation-techniques-comparison.component').then(
        m => m.EstimationTechniquesComparisonComponent
      ),
    data: {
      title: 'Planning Poker vs Other Estimation Techniques - Complete Comparison Guide',
      description:
        'Compare Planning Poker with T-Shirt Sizing, Bucket System, Magic Estimation, and other agile estimation techniques. Learn when to use each method for better team estimation.',
    },
  },
  {
    path: 'tools/story-point-calculator',
    loadComponent: () =>
      import(
        './tools/story-point-calculator/story-point-calculator.component'
      ).then(m => m.StoryPointCalculatorComponent),
    data: {
      title: 'Story Point Calculator',
      disablePostfix: true,
      description:
        'Convert story points into project timelines with our free Story Point Calculator.',
    },
  },
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],
})
export class LandingModule {}
