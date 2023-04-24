import { CommonModule, provideCloudinaryLoader } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { ZoomComponent } from './zoom/zoom.component';
import { OrganizationInvitationComponent } from './organization-invitation/organization-invitation.component';
import { MatDialogModule } from '@angular/material/dialog';
import { PremiumComponent } from './premium/premium.component';
import { NgOptimizedImage } from '@angular/common';
import { StartPlanningCtaComponent } from './components/start-planning-cta/start-planning-cta.component';

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
    data: { title: 'Features' },
  },
  { path: 'faq', component: FaqComponent, data: { title: 'FAQ' } },
  {
    path: 'privacy',
    component: PrivacyComponent,
    data: { title: 'Privacy Policy' },
  },
  {
    path: 'terms',
    component: TermsComponent,
    data: { title: 'Terms and Conditions' },
  },
  {
    path: 'zoom',
    component: ZoomComponent,
    data: { title: 'Zoom Integration' },
  },
  {
    path: 'organizationInvitation',
    component: OrganizationInvitationComponent,
    data: { title: 'Organization invitation' },
  },
  {
    path: 'premium',
    loadComponent: () => import('./premium/premium.component').then(mod => mod.PremiumComponent),
    data: { title: 'Premium' },
  },
  {
    path: 'integration/:result',
    loadComponent: () => import('./integration-result/integration-result.component').then(mod => mod.IntegrationResultComponent),
    data: { title: 'Integration finished' },
  },
];

@NgModule({
  declarations: [
    FeaturesComponent,
    FaqComponent,
    PageHeaderComponent,
    FaqRowComponent,
    PrivacyComponent,
    TermsComponent,
    ZoomComponent,
    HomeComponent,
    WrapperComponent,
    HeaderV2Component,
    OrganizationInvitationComponent,
    StartPlanningCtaComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ZoomAppBannerComponent,
    PremiumComponent,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatDividerModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    ZoomAppBannerComponent,
    NgOptimizedImage,
  ],
  providers: [
    provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')
  ]
})
export class LandingModule {}
