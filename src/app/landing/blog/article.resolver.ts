import { ResolveFn } from '@angular/router';
import { Article } from './types';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';

export const articleResolver: ResolveFn<Article> = (route, state) => {
  const httpClient = inject(HttpClient);

  const slug = route.paramMap.get('slug');

  return httpClient
    .get<string>(`/assets/articles/${slug}.json`)
    .pipe(tap(console.log));
};
