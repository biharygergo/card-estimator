import { Inject, Injectable, Renderer2, signal, DOCUMENT } from '@angular/core';
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

  constructor(@Inject(DOCUMENT) private _document: Document) {}

  /**
   * Injects one JSON-LD block into the document head.
   *
   * Pass an array to describe a page with several entities - an Article plus
   * its BreadcrumbList and FAQPage, say. They are emitted as a single @graph
   * rather than several script tags, which is what Google recommends and
   * keeps the cleanup below simple.
   */
  public setJsonLd(renderer2: Renderer2, data: unknown | unknown[]): void {
    const payload = Array.isArray(data)
      ? {
          '@context': 'https://schema.org',
          // Nodes carry their own @context when emitted alone; inside a @graph
          // the context belongs on the wrapper, so strip the duplicates.
          '@graph': data.map(node => {
            const { '@context': _discarded, ...rest } = node as Record<
              string,
              unknown
            >;
            return rest;
          }),
        }
      : data;

    const script = renderer2.createElement('script');
    script.type = 'application/ld+json';
    // script.text is textContent, so the live DOM is safe on its own. During
    // prerendering though, Angular serializes the DOM back to an HTML string,
    // and a literal </script> inside article copy would close this element
    // early. \u003C is valid JSON and renders identically to a parser.
    script.text = JSON.stringify(payload).replace(/</g, '\\u003C');
    script.setAttribute('class', 'structured-data-markup');

    // querySelectorAll, not querySelector: a single call could previously
    // leave earlier nodes behind, and stale schema is worse than none.
    this._document
      .querySelectorAll('script.structured-data-markup')
      .forEach(node => node.remove());
    this._document
      .querySelectorAll('script.default-structured-data')
      .forEach(node => node.remove());

    renderer2.appendChild(this._document.head, script);
  }
}
