import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute } from '@angular/router';
import {
  Observable,
  Subject,
  combineLatest,
  map,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent {
  article: Observable<Article> = inject(ActivatedRoute).data.pipe(
    map((data) => data.article),
    tap((article) => {
      this.titleService.setTitle(`${article.title} - PlanningPoker.live`);
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
        .map((value) => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value)
        .slice(0, 5)
    )
  );

  readonly destroy = new Subject<void>();
}
