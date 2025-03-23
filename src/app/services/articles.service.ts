import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Article } from '../landing/blog/types';
import { map } from 'rxjs';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  serverUrl =
    (this.configService.getCookie('useLocalArticles') === 'true')
      ? 'http://localhost:4200/assets'
      : 'https://storage.googleapis.com/planning-poker-public-assets';

  constructor(
    private readonly httpClient: HttpClient,
    private readonly configService: ConfigService
  ) {}

  getArticle(slug: string) {
    return this.httpClient.get<Article>(
      this.serverUrl + `/articles/${slug}.json?cacheBust=${Date.now()}`
    );
  }

  getArticles() {
    return this.httpClient
      .get<Article[]>(
        this.serverUrl + '/articles/index.json?cacheBust=' + Date.now()
      )
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
