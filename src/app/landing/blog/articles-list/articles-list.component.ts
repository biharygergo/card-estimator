import { Component, inject } from '@angular/core';
import { Article, Category } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage, DatePipe, NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

/**
 * Copy for every category, in the order the sections are rendered. Typed as a
 * Record<Category, ...> so adding a Category without giving it copy here is a
 * compile error - articles in an unlisted category would otherwise silently
 * disappear from this page while staying reachable by URL.
 */
const SECTION_COPY: Record<Category, { title: string; description: string }> = {
  guide: {
    title: 'Tutorials',
    description:
      'Learn how to use PlanningPoker.live with our in-depth tutorials covering basic usage, Jira/Linear integration and our embedded apps in Teams, Zoom, Meet and Webex.',
  },
  technique: {
    title: 'Planning poker techniques',
    description:
      'Learn how to estimate with Planning Poker, how to facilitate a session and how to use the app to get the most out of your estimation sessions.',
  },
  comparison: {
    title: 'Tool comparisons & alternatives',
    description:
      'Honest comparisons of planning poker tools, so you can pick the one that fits how your team estimates.',
  },
  other: {
    title: 'News & app updates',
    description:
      'Read about our latest updates, new features and improvements to the app.',
  },
};

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss'],
  imports: [
    RouterLink,
    NgOptimizedImage,
    CarbonAdComponent,
    DatePipe,
    MatIcon,
    NgTemplateOutlet,
    PageHeaderComponent,
  ],
})
export class ArticlesListComponent {
  articles: Article[] = inject(ActivatedRoute).snapshot.data.articles;
  articlesByCategory: Record<string, Article[]> = this.articles.reduce(
    (acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = [];
      }

      acc[curr.category].push(curr);
      return acc;
    },
    {}
  );

  /**
   * Section order follows SECTION_COPY key order. Sections with no articles
   * are dropped so an empty category never renders a bare heading.
   */
  sections = (Object.keys(SECTION_COPY) as Category[])
    .map(category => ({ category, ...SECTION_COPY[category] }))
    .filter(section => this.articlesByCategory[section.category]?.length > 0);
}
