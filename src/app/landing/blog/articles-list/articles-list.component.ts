import { Component, inject } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-articles-list',
    templateUrl: './articles-list.component.html',
    styleUrls: ['./articles-list.component.scss'],
    standalone: true,
    imports: [
        RouterLink,
        NgOptimizedImage,
        CarbonAdComponent,
        DatePipe,
        MatIcon,
    ],
})
export class ArticlesListComponent {
  articles: Article[] = inject(ActivatedRoute).snapshot.data.articles;
}
