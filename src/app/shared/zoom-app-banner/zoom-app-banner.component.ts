import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, tap } from 'rxjs';

const ZOOM_APP_PROMO_SEEN_KEY = 'zoomAppPromoSeen';

@Component({
  selector: 'zoom-app-banner',
  templateUrl: './zoom-app-banner.component.html',
  styleUrls: ['./zoom-app-banner.component.scss']
})
export class ZoomAppBannerComponent implements OnInit, OnDestroy {
  isZoomBannerHidden = true;

  onCloseClicked = new Subject<void>();
  destroy = new Subject<void>();
  constructor() {
    if (
      typeof window !== 'undefined' &&
      window?.localStorage &&
      !window.localStorage.getItem(ZOOM_APP_PROMO_SEEN_KEY)
    ) {
      this.isZoomBannerHidden = false;
    }
   }

  ngOnInit(): void {
    this.onCloseClicked.pipe(tap(() => {
      this.isZoomBannerHidden = true;
      window.localStorage.setItem(ZOOM_APP_PROMO_SEEN_KEY, '1');
    })).subscribe(this.destroy);
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

}
