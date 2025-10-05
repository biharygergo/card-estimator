import {
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  DOCUMENT,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Meta, Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  ActivatedRoute,
  Router,
  ActivationEnd,
  RouterOutlet,
} from '@angular/router';
import {
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  startWith,
  Subject,
  take,
  takeUntil,
} from 'rxjs';
import { NavigationService } from './services/navigation.service';
import { subscriptionResultModalCreator } from './shared/subscription-result/subscription-result.component';
import { SubscriptionResult } from './types';
import { Theme, ThemeService } from './services/theme.service';
import { isPlatformBrowser } from '@angular/common';
import { APP_CONFIG, AppConfig } from './app-config.module';
import { environment } from 'src/environments/environment';
import Clarity from '@microsoft/clarity';
import { SchemaTagService } from './services/schema-tag.service';
import Cookies from 'js-cookie';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [RouterOutlet],
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptionResult$: Observable<SubscriptionResult> =
    this.activatedRoute.queryParamMap.pipe(
      map(
        params => params.get('subscriptionResult') as SubscriptionResult | null
      ),
      filter(result => !!result)
    );

  referralCode$: Observable<string | null> =
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.get('referral') as string | null),
      filter(code => !!code)
    );

  onTitleUpdated$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
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
        noIndex: route?.snapshot?.data['noIndex'],
      };
    })
  );

  onThemeShouldChange$ = combineLatest([
    this.router.events.pipe(
      filter(event => event instanceof ActivationEnd),
      map((data: ActivationEnd) => data.snapshot.data),
      map(data => !!data['supportsTheme']),
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
    @Inject(PLATFORM_ID) private readonly platformId: Object,
    private schemaTagService: SchemaTagService
  ) {}

  ngOnInit() {
    this.onTitleUpdated$
      .pipe(takeUntil(this.destroyed))
      .subscribe(({ routeTitle, disablePostfix, description, noIndex }) => {
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

        if (noIndex) {
          this.metaService.updateTag({
            name: 'robots',
            content: 'noindex',
          });
        }
        const canonicalLink = this.document.querySelector(
          'link[rel="canonical"]'
        );
        this.renderer.setAttribute(
          canonicalLink,
          'href',
          `${environment.domain}${this.router.url}`
        );
      });

    this.subscriptionResult$
      .pipe(delay(500), takeUntil(this.destroyed))
      .subscribe(result => {
        const dialogRef = this.dialog.open(
          ...subscriptionResultModalCreator({ result })
        );
        dialogRef
          .afterClosed()
          .pipe(take(1))
          .subscribe(() => {
            this.router.navigate([], {
              relativeTo: this.activatedRoute,
              queryParams: { subscriptionResult: undefined },
              queryParamsHandling: 'merge',
            });
          });
      });

    this.referralCode$.pipe(takeUntil(this.destroyed)).subscribe(code => {
      if (code) {
        this.handleReferralTracking(code);
      }
    });

    this.onThemeShouldChange$
      .pipe(takeUntil(this.destroyed))
      .subscribe(([supportsTheme, themeValue]) => {
        if (supportsTheme) {
          Object.values(Theme).forEach(theme => {
            this.renderer.removeClass(this.document.body, theme);
          });

          this.renderer.addClass(this.document.body, themeValue);
        } else {
          this.renderer.removeClass(this.document.body, themeValue);
        }
      });

    if (isPlatformBrowser(this.platformId)) {
      this.renderer.addClass(
        this.document.body,
        `running-in-${this.config.runningIn}`
      );

      if (
        this.config.runningIn === 'web' &&
        (window as any).Cypress === undefined
      ) {
        Clarity.init('qngk5xwpfw');
      }
    }
    this.schemaTagService.setJsonLd(
      this.renderer,
      this.schemaTagService.currentSchema()
    );
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  private handleReferralTracking(referralCode: string): void {
    if (referralCode) {
      // Only set cookie if one doesn't already exist (first-touch attribution)
      const existingCookie = Cookies.get('pp_referral');
      if (!existingCookie) {
        // Store referral code in cookie (60 days) and localStorage
        Cookies.set('pp_referral', referralCode, {
          expires: 60,
          sameSite: 'Lax',
        });
        if (typeof window !== 'undefined' && window?.localStorage) {
          localStorage.setItem('pp_referral', referralCode);
        }
        console.log('Referral code stored:', referralCode);
      } else {
        console.log(
          'Referral code already exists, keeping first-touch attribution'
        );
      }
    }
  }
}
