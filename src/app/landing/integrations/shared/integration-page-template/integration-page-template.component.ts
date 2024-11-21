import { NgOptimizedImage } from '@angular/common';
import { Component, input} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { StartPlanningCtaComponent } from 'src/app/landing/components/start-planning-cta/start-planning-cta.component';

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
  standalone: true,
  imports: [MatButton, NgOptimizedImage, StartPlanningCtaComponent],
  templateUrl: './integration-page-template.component.html',
  styleUrl: './integration-page-template.component.scss',
})
export class IntegrationPageTemplateComponent {
  config = input<IntegrationConfig>();
}
