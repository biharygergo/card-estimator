import { CommonModule, NgOptimizedImage } from '@angular/common';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { Subject, take, takeUntil, tap } from 'rxjs';
import {
  AnalyticsService,
  ZoomAppCtaLocation,
} from 'src/app/services/analytics.service';
import { ConfigService } from 'src/app/services/config.service';
import { COOKIE_BEEN_HERE_BEFORE_KEY } from 'src/app/services/cookie.service';
import { EstimatorService } from 'src/app/services/estimator.service';

const ZOOM_APP_PROMO_SEEN_KEY = 'zoomAppPromoSeen';
const INTEGRATIONS = [
  {
    name: 'Teams',
    url: 'https://appsource.microsoft.com/en-us/product/office/WA200005858?tab=Overview',
    alt: 'Zoom logo',
    logo: '/assets/teams_logo.png',
  },
  {
    name: 'Zoom',
    url: 'https://marketplace.zoom.us/apps/nqabdP6JSI-uoVffd6A5Vg',
    alt: 'Zoom logo',
    logo: '/assets/zoom-logo.png',
  },
  {
    name: 'Meet',
    url: 'https://workspace.google.com/marketplace/app/planningpokerlive/417578634660',
    alt: 'Meet logo',
    logo: '/assets/meet_logo.png',
  },
  {
    name: 'Webex',
    url: 'https://apphub.webex.com/applications/planning-poker-planningpoker-live',
    alt: 'Webex logo',
    logo: '/assets/webex_logo.png',
  },
];

@Component({
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgOptimizedImage,
  ],
  selector: 'zoom-app-banner',
  templateUrl: './zoom-app-banner.component.html',
  styleUrls: ['./zoom-app-banner.component.scss'],
})
export class ZoomAppBannerComponent implements OnInit, OnDestroy {
  dialogContent = viewChild<TemplateRef<HTMLDivElement>>('dialogTemplate');
  @Input() bannerLocation!: ZoomAppCtaLocation;

  onCloseClicked = new Subject<void>();
  onInstallClicked = new Subject<void>();
  protected readonly integrations = INTEGRATIONS;

  protected readonly dialogRef = signal<
    MatDialogRef<HTMLDivElement, any> | undefined
  >(undefined);

  destroy = new Subject<void>();
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly configService: ConfigService,
    private readonly dialog: MatDialog,
    private readonly estimatorService: EstimatorService
  ) {}

  ngOnInit(): void {
    this.estimatorService
      .getPreviousSessions(1)
      .pipe(take(1))
      .subscribe(prevSessions => {
        if (
          prevSessions.length > 0 &&
          typeof window !== 'undefined' &&
          window?.localStorage &&
          !window.localStorage.getItem(ZOOM_APP_PROMO_SEEN_KEY) &&
          !!this.configService.getCookie(COOKIE_BEEN_HERE_BEFORE_KEY)
        ) {
          const ref = this.dialog.open(this.dialogContent(), {
            width: '90%',
            maxWidth: '800px',
          });
          ref
            .afterClosed()
            .pipe(takeUntil(this.destroy))
            .subscribe(() => {
              this.dialogRef().close();
              window.localStorage.setItem(ZOOM_APP_PROMO_SEEN_KEY, '1');
              this.analytics.logClickedCloseZoomAppBanner(this.bannerLocation);
            });
          this.dialogRef.set(ref);
        }
      });

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
