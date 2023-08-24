import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, tap } from 'rxjs';
import {
  AnalyticsService,
  ZoomAppCtaLocation,
} from 'src/app/services/analytics.service';
import { ConfigService } from 'src/app/services/config.service';
import {
  COOKIE_BEEN_HERE_BEFORE_KEY,
} from 'src/app/services/cookie.service';

const ZOOM_APP_PROMO_SEEN_KEY = 'zoomAppPromoSeen';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
  ],
  selector: 'zoom-app-banner',
  templateUrl: './zoom-app-banner.component.html',
  styleUrls: ['./zoom-app-banner.component.scss'],
})
export class ZoomAppBannerComponent implements OnInit, OnDestroy {
  @Input() bannerLocation!: ZoomAppCtaLocation;
  isZoomBannerHidden = true;

  onCloseClicked = new Subject<void>();
  onInstallClicked = new Subject<void>();

  destroy = new Subject<void>();
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly configService: ConfigService
  ) {
    if (
      typeof window !== 'undefined' &&
      window?.localStorage &&
      !window.localStorage.getItem(ZOOM_APP_PROMO_SEEN_KEY) &&
      !!this.configService.getCookie(COOKIE_BEEN_HERE_BEFORE_KEY)
    ) {
      this.isZoomBannerHidden = false;
    }
  }

  ngOnInit(): void {
    this.onCloseClicked
      .pipe(
        tap(() => {
          this.isZoomBannerHidden = true;
          window.localStorage.setItem(ZOOM_APP_PROMO_SEEN_KEY, '1');
          this.analytics.logClickedCloseZoomAppBanner(this.bannerLocation);
        }),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.onInstallClicked
      .pipe(
        tap(() => {
          this.analytics.logClickedInstallZoomApp(this.bannerLocation);
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
