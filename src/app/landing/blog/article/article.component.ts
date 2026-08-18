import { Component, Renderer2, inject, computed } from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, Subject, combineLatest, map, tap } from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { MarkdownComponent } from 'ngx-markdown';
import { NgOptimizedImage, AsyncPipe, DatePipe } from '@angular/common';
import { SchemaTagService } from 'src/app/services/schema-tag.service';
import type {
  Article as SchemaArticle,
  BreadcrumbList as SchemaBreadcrumbList,
  FAQPage as SchemaFAQPage,
  WithContext,
} from 'schema-dts';
import { YoutubePlayerComponent } from 'src/app/shared/youtube-player/youtube-player.component';
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';
import {
  PageHeaderComponent,
  Breadcrumb,
} from '../../components/page-header/page-header.component';
import { toSignal } from '@angular/core/rxjs-interop';

const ARTICLE_BASE_URL = 'https://planningpoker.live/knowledge-base';
const CLOUDINARY_BASE = 'https://res.cloudinary.com/dtvhnllmc/image/upload';

/** 16:9, 4:3 and 1:1 crops of one Cloudinary asset, as Google recommends. */
function coverImageVariants(coverImageId: string): string[] {
  return ['16:9', '4:3', '1:1'].map(
    ratio =>
      `${CLOUDINARY_BASE}/c_fill,ar_${ratio},w_1200/v1736183590/${coverImageId}`
  );
}

/** Rough word count of the markdown body, good enough for wordCount. */
function countWords(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.scss'],
  imports: [
    NgOptimizedImage,
    MarkdownComponent,
    StartPlanningCtaComponent,
    RouterLink,
    CarbonAdComponent,
    AsyncPipe,
    DatePipe,
    YoutubePlayerComponent,
    FaqSectionComponent,
    PageHeaderComponent,
  ],
})
export class ArticleComponent {
  private readonly metaService = inject(Meta);
  private readonly schemaTagService = inject(SchemaTagService);
  private readonly renderer2 = inject(Renderer2);

  article: Observable<Article> = inject(ActivatedRoute).data.pipe(
    map(data => ({
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
        {
          property: 'og:url',
          content: `${ARTICLE_BASE_URL}/${article.slug}`,
        },
        { property: 'og:type', content: 'article' },
        { property: 'og:site_name', content: 'PlanningPoker.live' },
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: article.description },
        {
          property: 'og:image',
          content: `https://res.cloudinary.com/dtvhnllmc/image/upload/v1736183590/${article.coverImageId}`,
        },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@PlanningPokerL' },
        { name: 'twitter:creator', content: '@PlanningPokerL' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: article.description },
        {
          name: 'twitter:image',
          content: `https://res.cloudinary.com/dtvhnllmc/image/upload/v1736183590/${article.coverImageId}`,
        },
      ]);

      const url = `${ARTICLE_BASE_URL}/${article.slug}`;
      const publishedAt = new Date(article.lastUpdated).toISOString();

      const articleNode: WithContext<SchemaArticle> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        // The article model carries a single date, so published and modified
        // are necessarily the same value here.
        datePublished: publishedAt,
        dateModified: publishedAt,
        author: {
          '@type': 'Person',
          name: article.author,
        },
        publisher: {
          '@type': 'Organization',
          name: 'PlanningPoker.live',
          logo: {
            '@type': 'ImageObject',
            url: 'https://planningpoker.live/assets/logo.webp',
          },
        },
        // Google asks for 16:9, 4:3 and 1:1 crops of the same image so it can
        // pick one per surface. Cloudinary generates them from the one asset.
        image: coverImageVariants(article.coverImageId),
        url,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': url,
        },
        inLanguage: 'en',
        articleSection: article.category,
        wordCount: countWords(article.content),
        keywords: article.tags.join(', '),
      };

      if (article.youtubeVideoId) {
        articleNode.video = {
          '@type': 'VideoObject',
          name: article.title,
          description: article.description,
          thumbnailUrl: `https://img.youtube.com/vi/${article.youtubeVideoId}/maxresdefault.jpg`,
          embedUrl: `https://www.youtube.com/embed/${article.youtubeVideoId}`,
          uploadDate: publishedAt,
        };
      }

      const breadcrumbNode: WithContext<SchemaBreadcrumbList> = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { name: 'Home', item: 'https://planningpoker.live' },
          { name: 'Knowledge Base', item: ARTICLE_BASE_URL },
          { name: article.title, item: url },
        ].map((crumb, index) => ({
          '@type': 'ListItem' as const,
          position: index + 1,
          name: crumb.name,
          item: crumb.item,
        })),
      };

      const schema: unknown[] = [articleNode, breadcrumbNode];

      if (article.faqs?.length) {
        const faqNode: WithContext<SchemaFAQPage> = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: article.faqs.map(faq => ({
            '@type': 'Question' as const,
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer' as const,
              text: faq.answer,
            },
          })),
        };
        schema.push(faqNode);
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
        .filter(article => article.slug !== currentArticle.slug)
        .slice(0, 5)
    )
  );
  readonly destroy = new Subject<void>();
}
