import { NgModule } from '@angular/core';
import { CommonModule, NgOptimizedImage, provideCloudinaryLoader } from '@angular/common';
import { ArticleComponent } from './article/article.component';
import { RouterModule, Routes } from '@angular/router';
import { articleResolver } from './article.resolver';
import { MarkdownModule } from 'ngx-markdown';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { MatChipsModule } from '@angular/material/chips';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';

const routes: Routes = [
  {
    path: ':slug',
    component: ArticleComponent,
    resolve: { article: articleResolver },
  },
];

@NgModule({
  declarations: [ArticleComponent],
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    RouterModule.forChild(routes),
    MarkdownModule.forRoot(),
    PageHeaderComponent,
    NgOptimizedImage,
    StartPlanningCtaComponent,
  ],
  providers: [provideCloudinaryLoader('https://res.cloudinary.com/dtvhnllmc')],

})
export class BlogModule {}
