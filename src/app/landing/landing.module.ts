import { CommonModule, provideCloudinaryLoader } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { Routes, RouterModule } from '@angular/router';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { FaqRowComponent } from './faq/faq-row/faq-row.component';
import { FaqComponent } from './faq/faq.component';
import { FeaturesComponent } from './features/features.component';
import { HeaderV2Component } from './header-v2/header-v2.component';
import { HomeComponent } from './home/home.component';
import { PrivacyComponent } from './privacy/privacy.component';
import { TermsComponent } from './terms/terms.component';
import { WrapperComponent } from './wrapper/wrapper.component';
import { ZoomComponent } from './integrations/zoom/zoom.component';
import { OrganizationInvitationComponent } from './organization-invitation/organization-invitation.component';
import { PremiumComponent } from './premium/premium.component';
import { NgOptimizedImage } from '@angular/common';
import { StartPlanningCtaComponent } from './components/start-planning-cta/start-planning-cta.component';
import { WebexComponent } from './integrations/webex/webex.component';
import { TeamsComponent } from './integrations/teams/teams.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CarbonAdComponent } from '../shared/carbon-ad/carbon-ad.component';
import { FeaturesItemsComponent } from './features/features-items/features-items.component';
import { FeaturesPreviewComponent } from './features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from './components/page-header-with-cta/page-header-with-cta.component';
import { MeetComponent } from './integrations/meet/meet.component';
import { SlackComponent } from './integrations/slack/slack.component';

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
    component: FeaturesComponent,
    data: {
      title: 'Features',
      description:
        'Check out all the features available in our app. JIRA integration, customizable card sets and more.',
    },
  },
  {
    path: 'faq',
    component: FaqComponent,
    data: {
      title: 'FAQ',
      description: 'All of our most frequently asked questions, answered.',
    },
  },
  {
    path: 'policies/privacy',
    component: PrivacyComponent,
    data: { title: 'Privacy Policy' },
  },
  {
    path: 'policies/terms',
    component: TermsComponent,
    data: { title: 'Terms and Conditions' },
  },
  {
    path: 'integrations/zoom',
    component: ZoomComponent,
    data: {
      title: 'Planning Poker for Zoom Meetings',
      description:
        'Install our embedded app for Zoom Meetings, the most convenient way to estimate stories.',
      disablePostfix: true,
    },
  },
  {
    path: 'integrations/webex',
    component: WebexComponent,
    data: {
      title: 'Planning Poker for Webex Meetings',
      disablePostfix: true,
      description:
        'Install our embedded app for Webex Meetings, the most convenient way to estimate stories.',
    },
  },
  {
    path: 'integrations/teams',
    component: TeamsComponent,
    data: {
      title: 'Planning Poker for Microsoft Teams',
      disablePostfix: true,
      description:
        'Install our embedded app for Microsoft Teams, the most convenient way to estimate stories. Plugin made for Microsoft Teams.',
    },
  },
  {
    path: 'integrations/meet',
    component: MeetComponent,
    data: {
      title: 'Planning Poker for Google Meet',
      disablePostfix: true,
      description:
        'Install our integration for Google Meet, the simplest way to estimate stories.',
    },
  },
  {
    path: 'integrations/slack',
    loadComponent: () => import('./integrations/slack/slack.component').then((mod) => mod.SlackComponent),
    data: {
      title: 'Planning Poker for Slack',
      disablePostfix: true,
      description:
        'Integrate PlanningPoker.live with Slack and create rooms directly from your Slack channel.',
    },
  },
  {
    path: 'integrations/jira',
    loadComponent: () => import('./integrations/jira/jira.component').then((mod) => mod.JiraComponent),
    data: {
      title: 'Estimate JIRA Issues with PlanningPoker.live',
      disablePostfix: true,
      description:
        'Connect your JIRA account with PlanningPoker.live to estimate issues directly from your backlog.',
    },
  },
  {
    path: 'integrations/linear',
    loadComponent: () => import('./integrations/linear/linear.component').then((mod) => mod.LinearComponent),
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
    loadComponent: () => import('./integrations/integrations.component').then((mod) => mod.IntegrationsComponent),
    data: {
      title: 'Integrations',
      description: 'PlanningPoker.live integrates with your favorite tools. JIRA, Zoom, Microsoft Teams and more.',
    }
  },
  {
    path: 'organizationInvitation',
    component: OrganizationInvitationComponent,
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
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ZoomAppBannerComponent,
    PremiumComponent,
    CarbonAdComponent,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    ZoomAppBannerComponent,
    NgOptimizedImage,
    PageHeaderComponent,
    StartPlanningCtaComponent,
    FeaturesComponent,
    FeaturesItemsComponent,
    FeaturesPreviewComponent,
    FaqComponent,
    FaqRowComponent,
    PrivacyComponent,
    TermsComponent,
    ZoomComponent,
    HomeComponent,
    WrapperComponent,
    HeaderV2Component,
    OrganizationInvitationComponent,
    WebexComponent,
    TeamsComponent,
    PageHeaderWithCtaComponent,
  ],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],
})
export class LandingModule {}
