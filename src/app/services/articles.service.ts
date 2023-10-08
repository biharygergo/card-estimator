import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Article } from '../landing/blog/types';

@Injectable({
  providedIn: 'root',
})
export class ArticlesService {
  constructor(private readonly httpClient: HttpClient) {}

  getArticle(slug: string) {
    return this.httpClient.get<Article>(`/assets/articles/${slug}.json`);
  }

  getArticles() {
    return this.httpClient.get<Article[]>(`/assets/articles/index.json`);
  }
}
