import { Component, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute } from '@angular/router';
import { ArticlesService } from 'src/app/services/articles.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-articles-list',
  templateUrl: './articles-list.component.html',
  styleUrls: ['./articles-list.component.scss'],
})
export class ArticlesListComponent {
  articles: Article[] = inject(ActivatedRoute).snapshot.data.articles;
}
