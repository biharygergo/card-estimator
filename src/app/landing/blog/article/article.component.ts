import {
  Component,
  Renderer2,
  inject,
} from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, combineLatest, map, tap } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { MarkdownComponent } from 'ngx-markdown';
import { NgIf, NgOptimizedImage, AsyncPipe, DatePipe } from '@angular/common';
import { SchemaTagService } from 'src/app/services/schema-tag.service';
import type { Article as SchemaArticle, WithContext } from 'schema-dts';
import { YoutubePlayerComponent } from 'src/app/shared/youtube-player/youtube-player.component';
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgOptimizedImage,
    MarkdownComponent,
    StartPlanningCtaComponent,
    RouterLink,
    CarbonAdComponent,
    AsyncPipe,
    DatePipe,
    YoutubePlayerComponent,
    FaqSectionComponent,
  ],
})
export class ArticleComponent {
  private readonly metaService = inject(Meta);
  private readonly schemaTagService = inject(SchemaTagService);
  private readonly renderer2 = inject(Renderer2);

  article: Observable<Article> = inject(
    ActivatedRoute
  ).data.pipe(
    map((data) => ({
      ...data.article,
    })),
    tap((article: Article) => {
      this.titleService.setTitle(`${article.title} - PlanningPoker.live`);
      this.metaService.updateTag({
        name: 'description',
        content: article.description,
      });
      this.metaService.addTags([
        { name: 'keywords', content: article.tags.join(', ') },
        { name: 'author', content: article.author },
        { property: 'og:url', content: `https://planningpoker.live/blog/${article.slug}` },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'PlanningPoker.live' },
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.description },
        { property: 'og:image', content: `https://res.cloudinary.com/dtvhnllmc/image/upload/v1736183590/${article.coverImageId}` },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@PlanningPokerL' },
        { name: 'twitter:creator', content: '@PlanningPokerL' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: article.description },
        { name: 'twitter:image', content: `https://res.cloudinary.com/dtvhnllmc/image/upload/v1736183590/${article.coverImageId}` },
      ]);

      const schema: WithContext<SchemaArticle> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        datePublished: new Date(article.lastUpdated).toISOString(),
        dateModified: new Date(article.lastUpdated).toISOString(),
        author: {
          '@type': 'Person',
          name: article.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'PlanningPoker.live',
          logo: {
            '@type': 'ImageObject',
            url: 'https://planningpoker.live/assets/logo.png',
          },
        },
        image: `https://res.cloudinary.com/dtvhnllmc/image/upload/v1736183590/${article.coverImageId}`,
        keywords: article.tags.join(', '),
      };

      if (article.youtubeVideoId) {
        schema.video = {
          '@type': 'VideoObject',
          name: article.title,
          description: article.description,
          thumbnailUrl: `https://img.youtube.com/vi/${article.youtubeVideoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${article.youtubeVideoId}`,
          uploadDate: new Date(article.lastUpdated).toISOString(),
        };
      }

      this.schemaTagService.setJsonLd(this.renderer2, schema);
    })
  );
  titleService = inject(Title);
  recommendations = combineLatest([
    inject(ArticlesService).getArticles(),
    this.article,
  ]).pipe(
    map(([articles, currentArticle]) =>
      articles
        .filter((article) => article.slug !== currentArticle.slug)
        .slice(0, 5)
    )
  );
  readonly destroy = new Subject<void>();
}
