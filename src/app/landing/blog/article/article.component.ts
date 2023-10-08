import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, takeUntil } from 'rxjs';
import { Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit {
  article: Article = inject(ActivatedRoute).snapshot.data.article;
  titleService = inject(Title);
  readonly destroy = new Subject<void>();

  ngOnInit() {
    this.titleService.setTitle(`${this.article.title} - PlanningPoker.live`);
  }
}
