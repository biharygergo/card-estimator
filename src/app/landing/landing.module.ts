import { CommonModule, provideCloudinaryLoader } from '@angular/common';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./home/home.component').then(mod => mod.HomeComponent),
    data: {
      title: 'Planning Poker Online Free - Scrum Poker & Agile Estimation Tool',
      description:
        'Free online planning poker tool for agile teams. Run scrum poker sessions in your browser with JIRA/Linear integration, custom cards, and anonymous voting. No sign-up required! Start your estimation poker session now.',
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
      title: 'Planning Poker Features - Free Online Scrum Estimation Tool',
      description:
        'Discover powerful planning poker features: custom card sets, JIRA/Linear integration, Zoom/Teams support, anonymous voting, and more. Best free agile estimation tool for remote teams.',
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
    path: 'glossary',
    loadComponent: () =>
      import('./glossary/glossary.component').then(mod => mod.GlossaryComponent),
    data: {
      title: 'Planning Poker & Agile Estimation Glossary',
      description:
        'Comprehensive glossary of Planning Poker and Agile estimation terms. Learn definitions for story points, velocity, Fibonacci sequence, affinity estimation, and more planning poker terminology.',
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
      title: 'Zoom Planning Poker - Free Scrum Poker App for Zoom Meetings',
      description:
        'Run planning poker directly in Zoom meetings with our free embedded app. Install the best scrum estimation tool for Zoom and estimate stories without leaving your video call.',
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
      title: 'Planning Poker for Microsoft Teams - Free Scrum Poker App',
      disablePostfix: true,
      description:
        'Install free planning poker for Microsoft Teams. Run scrum estimation sessions directly in Teams meetings. Best agile poker app for Teams with instant setup.',
    },
  },
  {
    path: 'integrations/meet',
    loadComponent: () =>
      import('./integrations/meet/meet.component').then(
        mod => mod.MeetComponent
      ),
    data: {
      title: 'Google Meet Planning Poker - Free Scrum Estimation Extension',
      disablePostfix: true,
      description:
        'Run planning poker in Google Meet with our free extension. Estimate stories without leaving your video call. Simple setup for agile teams using Meet.',
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
      title: 'JIRA Planning Poker - Free Online Scrum Poker for JIRA',
      disablePostfix: true,
      description:
        'Connect JIRA with PlanningPoker.live for seamless story point estimation. Import issues, run planning poker sessions, and sync estimates back to JIRA automatically. Free tool for agile teams.',
    },
  },
  {
    path: 'integrations/linear',
    loadComponent: () =>
      import('./integrations/linear/linear.component').then(
        mod => mod.LinearComponent
      ),
    data: {
      title: 'Linear Planning Poker - Free Agile Estimation for Linear',
      disablePostfix: true,
      description:
        'Connect Linear with PlanningPoker.live for effortless story point estimation. Import issues, run scrum poker sessions, and sync estimates back to Linear. Free integration for agile teams.',
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
      title: 'Planning Poker Pricing - Free Online Tool with Paid Plans',
      disablePostfix: true,
      description:
        'Free planning poker online with monthly credits. Upgrade for unlimited sessions, advanced features, and priority support. Simple pricing with no hidden fees for agile teams.',
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
      title: 'Free Printable Planning Poker Cards - Download PDF',
      description:
        'Download free printable planning poker cards for scrum estimation. Professionally designed cards with Fibonacci sequence. Perfect for in-person agile sessions or as backup cards.',
    },
  },
  {
    path: 'getting-started',
    loadComponent: () =>
      import('./getting-started/getting-started.component').then(
        m => m.GettingStartedComponent
      ),
    data: {
      title: 'How to Play Planning Poker Online - Free Tutorial & Getting Started Guide',
      description:
        'Learn how to run online planning poker sessions with our step-by-step tutorial. Complete getting started guide with video tutorials for scrum poker estimation. Free for agile teams.',
    },
  },
  {
    path: 'what-is-planning-poker',
    loadComponent: () =>
      import('./what-is-planning-poker/what-is-planning-poker.component').then(
        m => m.WhatIsPlanningPokerComponent
      ),
    data: {
      title: 'What is Planning Poker? Complete Guide to Scrum Poker Estimation',
      description:
        'Learn what planning poker is and how this scrum estimation technique works. Discover why agile teams use planning poker cards for story point estimation. Complete guide with examples.',
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
