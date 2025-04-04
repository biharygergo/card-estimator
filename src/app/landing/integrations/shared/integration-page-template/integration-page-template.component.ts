import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { StartPlanningCtaComponent } from 'src/app/landing/components/start-planning-cta/start-planning-cta.component';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';
import { YoutubePlayerComponent } from '../../../../shared/youtube-player/youtube-player.component';
import {
  FaqRow,
  FaqSectionComponent,
} from 'src/app/landing/faq/faq-section/faq-section.component';

export interface IntegrationConfig {
  header: {
    title: string;
    description: string;
    buttonLabel: string;
    videoId: string;
    aspectRatio: string;
  };
  details: {
    description: string;
    youtubeVideo?: {
      title: string;
      videoId: string;
    };
    faqs?: FaqRow[];
    steps: {
      title: string;
      text: string;
      imgId: string;
      alt: string;
      width: number;
      height: number;
      notAppScreenshot?: boolean;
    }[];
  };
  action: () => void;
}

@Component({
  selector: 'planning-poker-integration-page-template',
  imports: [
    MatButton,
    NgOptimizedImage,
    StartPlanningCtaComponent,
    CarbonAdComponent,
    YoutubePlayerComponent,
    FaqSectionComponent,
  ],
  templateUrl: './integration-page-template.component.html',
  styleUrl: './integration-page-template.component.scss',
})
export class IntegrationPageTemplateComponent {
  config = input<IntegrationConfig>();
}
