import { Component, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage, DatePipe, NgTemplateOutlet } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';

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
  articlesByCategory: { [key: string]: Article[] } = this.articles.reduce(
    (acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = [];
      }

      acc[curr.category].push(curr);
      return acc;
    },
    {}
  );
}
