import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Article } from '../landing/blog/types';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  constructor(
    private readonly httpClient: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Optional() @Inject('serverUrl') protected serverUrl: string
  ) {}

  getArticle(slug: string) {
    return this.httpClient.get<Article>(
      `https://storage.googleapis.com/planning-poker-public-assets/articles/${slug}.json`
    );
  }

  getArticles() {
    return this.httpClient.get<Article[]>(
      'https://storage.googleapis.com/planning-poker-public-assets/articles/index.json'
    );
  }
}
