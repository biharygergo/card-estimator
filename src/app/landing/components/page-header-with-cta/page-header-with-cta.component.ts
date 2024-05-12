import { Component, Input } from '@angular/core';

export interface HeaderConfig {
  title: string;
  description: string;
  internalLink?: string;
  externalLink?: string;
  ctaIcon: string;
  ctaTitle: string;
  showPlatforms: boolean;
}
@Component({
  selector: 'planning-poker-page-header-with-cta',
  templateUrl: './page-header-with-cta.component.html',
  styleUrl: './page-header-with-cta.component.scss'
})
export class PageHeaderWithCtaComponent {
  @Input({required: true}) config!: HeaderConfig;
}
