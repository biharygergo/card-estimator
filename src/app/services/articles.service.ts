import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Optional, PLATFORM_ID } from '@angular/core';
import { Article } from '../landing/blog/types';
import { map } from 'rxjs';

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
    const serverUrl = `https://storage.googleapis.com/planning-poker-public-assets`;
    return this.httpClient.get<Article>(serverUrl + `/articles/${slug}.json`);
  }

  getArticles() {
    const serverUrl = 'https://storage.googleapis.com/planning-poker-public-assets';
    return this.httpClient
      .get<Article[]>(serverUrl + '/articles/index.json')
      .pipe(
        map((articles) =>
          articles.sort(
            (a, b) =>
              new Date(b.lastUpdated).getTime() -
              new Date(a.lastUpdated).getTime()
          )
        )
      );
  }
}
