import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import {
  MatButton,
  MatButtonModule,
  MatFabButton,
} from '@angular/material/button';
import { FeaturesItemsComponent } from '../features/features-items/features-items.component';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatAccordion,
} from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../components/page-header-with-cta/page-header-with-cta.component';
import { RouterLink } from '@angular/router';

const KNOWLEDGE_BASE_SAMPLES = [
  {
    title:
      'The Definitive Guide to Planning Poker - Master Agile Estimation Poker Techniques',
    description:
      'Master Agile estimation with our simple guide to Planning Poker, also known as Agile Poker or Scrum Poker. Discover how this powerful tool enhances team collaboration, accuracy, and project success.',
    imageId: 'pexels-fauxels-3183197_k4uned',
    imageAlt: 'People at a meeting table',
    slug: 'planning-poker-guide-agile-estimation-techniques',
  },
  {
    title: '5 Essential Scrum Master Tools to Empower Your Agile Team',
    description:
      "Discover the top 5 must-have tools that every Scrum Master needs to streamline processes, boost collaboration, and drive project success. From project management to retrospectives, we've got you covered.",
    imageId: 'Feautres_Zoom_fkn3mh',
    imageAlt: 'Application logos scattered',
    slug: 'essential-scrum-master-tools',
  },
  {
    title: 'Guide to Installing Planning Poker in Microsoft Teams',
    description:
      "Explore step-by-step instructions for integrating Planning Poker into Microsoft Teams. Enhance your team's estimation process with this comprehensive installation guide.",
    imageId: 'Instruction_Teams_3_h61ccs',
    imageAlt: 'PlanningPoker.live running in Teams',
    slug: 'installing-planning-poker-microsoft-teams-guide',
  },
];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    PageHeaderWithCtaComponent,
    FeaturesPreviewComponent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FeaturesItemsComponent,
    MatFabButton,
    MatIcon,
    MatTabGroup,
    MatTab,
    MatAccordion,
    MatButtonModule,
    NgOptimizedImage,
    CarbonAdComponent,
    RouterLink,
  ],
})
export class HomeComponent implements OnInit {
  companies = [
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
    'siemens',
    'trustly',
    'loreal',
    'betsson',
    'algolia',
    'allianz',
    // Repeat the first six
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
  ];
  logos = this.companies.map((company) => `${company}_logo`);
  loadVideos = new BehaviorSubject<boolean>(false);
  protected knowledgeBaseSamples = KNOWLEDGE_BASE_SAMPLES;
  constructor() {}

  ngOnInit(): void {}

  viewAllFeaturesOpened() {
    this.loadVideos.next(true);
  }
}
