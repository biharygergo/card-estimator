import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, Renderer2, signal } from '@angular/core';
import { WebApplication, WithContext } from 'schema-dts';
import { FaqItem } from '../types';

const DEFAULT_DATA: WithContext<WebApplication> = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  applicationCategory: 'DeveloperApplication',
  applicationSubCategory: 'AgileTooling',
  name: 'PlanningPoker.live',
  image: 'https://planningpoker.live/assets/logo.png',
  description:
    'Estimate stories in your remote team with this easy-to-use app. Real-time voting, Jira integration, adjustable cards and more. No account required.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.6',
    bestRating: '5',
    worstRating: '1',
    ratingCount: '171',
  },
  sourceOrganization: {
    '@type': 'Organization',
    name: 'PlanningPoker.live',
    url: 'https://planningpoker.live',
    logo: 'https://planningpoker.live/assets/logo.png',
  },
  operatingSystem: 'All',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  featureList: [
    'Real-time voting',
    'JIRA integration',
    'Linear integration',
    'Custom card sets',
    'Anonymous voting',
    'Video conferencing integration',
    'Password protection',
    'Timer functionality',
    'Statistics and reporting',
    'Export to CSV',
  ],
  audience: {
    '@type': 'Audience',
    audienceType:
      'Agile Teams, Scrum Masters, Product Owners, Software Developers',
  },
  keywords:
    'planning poker, scrum poker, agile estimation, story points, sprint planning, remote teams',
  potentialAction: {
    '@type': 'UseAction',
    target: 'https://planningpoker.live/create',
  },
};

@Injectable({
  providedIn: 'root',
})
export class SchemaTagService {
  currentSchema = signal<WithContext<WebApplication>>(DEFAULT_DATA);

  constructor(
    @Inject(DOCUMENT) private _document: Document,
  ) {}

  public setJsonLd(renderer2: Renderer2, data: any): void {
    let script = renderer2.createElement('script');
    script.type = 'application/ld+json';
    script.text = `${JSON.stringify(data)}`;
    script.setAttribute('class', 'structured-data-markup');

    // Remove existing elements
    const existing = this._document.querySelector(
      'script.structured-data-markup'
    );
    if (existing) {
      renderer2.removeChild(this._document.body, existing);
    }
    const defaultData = this._document.querySelector(
      'script.default-structured-data'
    );
    if (defaultData) {
      renderer2.removeChild(this._document.body, defaultData);
    }

    renderer2.appendChild(this._document.head, script);
  }
}
