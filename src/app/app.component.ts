import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Meta, Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  ActivatedRoute,
  Router,
  ActivationEnd,
} from '@angular/router';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  startWith,
  Subject,
  takeUntil,
} from 'rxjs';
import { NavigationService } from './services/navigation.service';
import { subscriptionResultModalCreator } from './shared/subscription-result/subscription-result.component';
import { SubscriptionResult } from './types';
import { Theme, ThemeService } from './services/theme.service';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { APP_CONFIG, AppConfig } from './app-config.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptionResult$: Observable<SubscriptionResult> =
    this.activatedRoute.queryParamMap.pipe(
      map(
        (params) =>
          params.get('subscriptionResult') as SubscriptionResult | null
      ),
      filter((result) => !!result)
    );

  onTitleUpdated$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => {
      let route: ActivatedRoute = this.router.routerState.root;
      let routeTitle = '';
      let description: string;
      while (route!.firstChild) {
        route = route.firstChild;
      }
      if (route.snapshot.data['title']) {
        routeTitle = route!.snapshot.data['title'];
      }
      if (route.snapshot.data['description']) {
        description = route!.snapshot.data['description'];
      }
      return {
        routeTitle,
        description,
        disablePostfix: route?.snapshot?.data['disablePostfix'],
      };
    })
  );

  onThemeShouldChange$ = combineLatest([
    this.router.events.pipe(
      filter((event) => event instanceof ActivationEnd),
      map((data: ActivationEnd) => data.snapshot.data),
      map((data) => !!data['supportsTheme']),
      distinctUntilChanged()
    ),
    this.themeService.themeValue,
  ]);

  private readonly destroyed = new Subject<void>();

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private router: Router,
    private titleService: Title,
    private metaService: Meta,
    private readonly navigationService: NavigationService,
    private readonly dialog: MatDialog,
    private readonly themeService: ThemeService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(APP_CONFIG) public readonly config: AppConfig,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {}

  ngOnInit() {
    this.onTitleUpdated$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ routeTitle, disablePostfix, description }) => {
        if (routeTitle) {
          this.titleService.setTitle(
            `${routeTitle}${disablePostfix ? '' : ' - Planning Poker'}`
          );
        }
        if (description) {
          this.metaService.updateTag({
            name: 'description',
            content: description,
          });
        }
      });

    this.subscriptionResult$
      .pipe(takeUntil(this.destroyed))
      .subscribe((result) => {
        this.dialog.open(...subscriptionResultModalCreator({ result }));
      });

    this.onThemeShouldChange$
      .pipe(takeUntil(this.destroyed))
      .subscribe(([supportsTheme, themeValue]) => {
        if (supportsTheme) {
          Object.values(Theme).forEach((theme) => {
            this.renderer.removeClass(this.document.body, theme);
          });

          this.renderer.addClass(
            this.document.body,
            themeValue
          );
        } else {
          this.renderer.removeClass(
            this.document.body,
            themeValue
          );
        }
      });

    if (isPlatformBrowser(this.platformId)) {
      this.renderer.addClass(
        this.document.body,
        `running-in-${this.config.runningIn}`
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
