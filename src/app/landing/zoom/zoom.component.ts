import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
  selector: 'app-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.scss'],
})
export class ZoomComponent implements OnInit, OnDestroy {
  onInstallClicked = new Subject<void>();

  destroy = new Subject<void>();

  selectedIndex = 0;
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
