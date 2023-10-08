import { ResolveFn } from '@angular/router';
import { Article } from './types';
import { inject } from '@angular/core';
import { ArticlesService } from 'src/app/services/articles.service';

export const articleResolver: ResolveFn<Article> = (route, state) => {
  const articlesService = inject(ArticlesService);

  const slug = route.paramMap.get('slug');

  return articlesService.getArticle(slug);
};

export const articlesResolver: ResolveFn<Article[]> = (route, state) => {
  const articlesService = inject(ArticlesService);

  return articlesService.getArticles();
};
