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
    platformName: string; // The platform name to highlight (e.g., "Jira", "Linear", "Slack")
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

// Title segment with highlight info
interface TitleSegment {
  text: string;
  highlighted: boolean;
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
  
  // Computed title segments for highlighting the platform name
  get titleSegments(): TitleSegment[] {
    const cfg = this.config();
    if (!cfg?.header.platformName) {
      return [{ text: cfg?.header.title || '', highlighted: false }];
    }
    
    const segments: TitleSegment[] = [];
    const title = cfg.header.title;
    const platform = cfg.header.platformName;
    const index = title.indexOf(platform);
    
    if (index === -1) {
      return [{ text: title, highlighted: false }];
    }
    
    if (index > 0) {
      segments.push({ text: title.substring(0, index), highlighted: false });
    }
    segments.push({ text: platform, highlighted: true });
    const remaining = title.substring(index + platform.length);
    if (remaining) {
      segments.push({ text: remaining, highlighted: false });
    }
    
    return segments;
  }
}
