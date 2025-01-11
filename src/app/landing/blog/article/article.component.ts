import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Signal,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Article } from '../types';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Observable,
  Subject,
  combineLatest,
  map,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { Meta, Title } from '@angular/platform-browser';
import { ArticlesService } from 'src/app/services/articles.service';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { MarkdownComponent } from 'ngx-markdown';
import { NgIf, NgOptimizedImage, AsyncPipe, DatePipe } from '@angular/common';
import { YouTubePlayer } from '@angular/youtube-player';

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
    YouTubePlayer,
  ],
})
export class ArticleComponent implements AfterViewInit {
  private readonly metaService = inject(Meta);
  article: Observable<Article & { tagsString: string }> = inject(
    ActivatedRoute
  ).data.pipe(
    map((data) => ({
      ...data.article,
      tagsString: data.article.tags.map((tag) => `#${tag}`).join(', '),
    })),
    tap((article: Article & { tagsString: string }) => {
      this.titleService.setTitle(`${article.title} - PlanningPoker.live`);
      this.metaService.updateTag({
        name: 'description',
        content: article.description,
      });
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

  youtubePlayerContainer: Signal<ElementRef<HTMLDivElement>> = viewChild(
    'youtubePlayerContainer'
  );
  youtubePlayerSize = signal({ width: 560, height: 315 });
  readonly destroy = new Subject<void>();

  ngAfterViewInit() {
    this.onResize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.youtubePlayerContainer()) {
      const width = this.youtubePlayerContainer().nativeElement.clientWidth;
      const height = width * 0.56;

      this.youtubePlayerSize.set({ width, height });
    }
  }
}
