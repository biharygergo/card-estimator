import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';

@Injectable({
  providedIn: 'root',
})
export class ScreenTrackingService {
  constructor(
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: Object
  ) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void getFirebaseAnalytics().then(analytics => {
      if (!analytics) {
        return;
      }

      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe(event => {
          logEvent(analytics, 'screen_view', {
            firebase_screen: event.urlAfterRedirects,
            firebase_screen_class: event.urlAfterRedirects,
          });
        });
    });
  }
}
