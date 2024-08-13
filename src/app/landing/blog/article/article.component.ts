import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Observable,
  Subject,
  combineLatest,
  map,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { MarkdownComponent } from 'ngx-markdown';
import { NgIf, NgOptimizedImage, AsyncPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'app-article',
    templateUrl: './article.component.html',
    styleUrls: ['./article.component.scss'],
    standalone: true,
    imports: [
        NgIf,
        NgOptimizedImage,
        MarkdownComponent,
        StartPlanningCtaComponent,
        RouterLink,
        CarbonAdComponent,
        AsyncPipe,
        DatePipe,
    ],
})
export class ArticleComponent {
  private readonly metaService = inject(Meta);
  article: Observable<Article> = inject(ActivatedRoute).data.pipe(
    map((data) => data.article),
    tap((article: Article) => {
      this.titleService.setTitle(`${article.title} - PlanningPoker.live`);
      this.metaService.updateTag({
        name: 'description',
        content: article.description,
      });
    })
  );
  titleService = inject(Title);
  recommendations = combineLatest([
    inject(ArticlesService).getArticles(),
    this.article,
  ]).pipe(
    map(([articles, currentArticle]) =>
      articles
        .filter((article) => article.slug !== currentArticle.slug)
        .slice(0, 5)
    )
  );

  readonly destroy = new Subject<void>();
}
