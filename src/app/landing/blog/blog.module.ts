import { NgModule } from '@angular/core';
import {
  CommonModule,
  NgOptimizedImage,
  provideCloudinaryLoader,
} from '@angular/common';
import { ArticleComponent } from './article/article.component';
import { RouterModule, Routes } from '@angular/router';
import { articleResolver, articlesResolver } from './article.resolver';
import { MarkdownModule } from 'ngx-markdown';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { MatChipsModule } from '@angular/material/chips';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { ArticlesListComponent } from './articles-list/articles-list.component';
import { MatButtonModule } from '@angular/material/button';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';

const routes: Routes = [
  {
    path: ':slug',
    component: ArticleComponent,
    resolve: { article: articleResolver },
  },
  {
    path: '',
    component: ArticlesListComponent,
    resolve: { articles: articlesResolver },
    data: {
      title: 'Master Planning Poker: The Ultimate Knowledge Hub',
      disablePostfix: true,
      description:
        'Get expert guides, tutorials & insider tips to make the most of PlanningPoker.live. Level up your estimation game!',
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatButtonModule,
    RouterModule.forChild(routes),
    MarkdownModule.forRoot(),
    PageHeaderComponent,
    NgOptimizedImage,
    StartPlanningCtaComponent,
    CarbonAdComponent,
    ArticleComponent,
    ArticlesListComponent,
  ],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],
})
export class BlogModule {}
