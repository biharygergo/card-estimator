import { ResolveFn } from '@angular/router';
import { Article } from './types';
import { inject } from '@angular/core';
import { ArticlesService } from 'src/app/services/articles.service';
import { Observable, first } from 'rxjs';

export const articleResolver: ResolveFn<Article> = (
  route
): Observable<Article> => {
  const articlesService = inject(ArticlesService);

  return articlesService.getArticle(route.paramMap.get('slug')).pipe(first());
};

export const articlesResolver: ResolveFn<Article[]> = (): Observable<
  Article[]
> => {
  const articlesService = inject(ArticlesService);

  return articlesService.getArticles().pipe(first());
};
