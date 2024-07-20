import { Component, Input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

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
    styleUrl: './page-header-with-cta.component.scss',
    standalone: true,
    imports: [MatIcon, MatAnchor, RouterLink, NgOptimizedImage]
})
export class PageHeaderWithCtaComponent {
  @Input({required: true}) config!: HeaderConfig;
}
