import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil, tap } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FeaturesItemsComponent } from '../../features/features-items/features-items.component';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../../components/page-header-with-cta/page-header-with-cta.component';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';

@Component({
  selector: 'app-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.scss'],
  standalone: true,
  imports: [
    PageHeaderWithCtaComponent,
    FeaturesPreviewComponent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FeaturesItemsComponent,
    MatTabGroup,
    MatTab,
    MatDivider,
    RouterLink,
    StartPlanningCtaComponent,
    CarbonAdComponent,
  ],
})
export class ZoomComponent implements OnInit, OnDestroy {
  onInstallClicked = new Subject<void>();

  destroy = new Subject<void>();

  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);

  constructor(private readonly analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.onInstallClicked
      .pipe(
        tap(() => {
          this.analytics.logClickedInstallZoomApp('detail_page');
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
