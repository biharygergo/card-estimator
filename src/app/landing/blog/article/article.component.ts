import { Component, OnInit, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
})
export class ArticleComponent implements OnInit {
  article: Article = inject(ActivatedRoute).snapshot.data.article as Article;
  titleService = inject(Title);

  ngOnInit() {
    this.titleService.setTitle(`${this.article.title} - PlanningPoker.live`)
  }
}
