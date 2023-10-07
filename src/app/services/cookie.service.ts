import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService } from './config.service';

export const COOKIE_ACCEPTED_KEY = 'cookiesAccepted';
export const COOKIE_BEEN_HERE_BEFORE_KEY = 'beenHereBefore';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  showCookieBanner = true;

  constructor(
    private snackBar: MatSnackBar,
    private readonly configService: ConfigService
  ) {}

  tryShowCookieBanner() {
    if (
      typeof window !== 'undefined' &&
      window?.localStorage &&
      !window.localStorage.getItem(COOKIE_ACCEPTED_KEY) &&
      this.isLikelyInEurope()
    ) {
      const snackbarRef = this.snackBar.open(
        'This site uses cookies to analyze traffic and improve your experience. Read more about how cookies are used in our Privacy Policy.',
        'Got it'
      );
      snackbarRef.onAction().subscribe(() => {
        snackbarRef.dismiss();
        window.localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
        this.saveBeenHereBeforeCookie();
      });
    } else if (!this.isLikelyInEurope) {
      this.saveBeenHereBeforeCookie();
    }
  }

  saveBeenHereBeforeCookie() {
    this.configService.setCookie(COOKIE_BEEN_HERE_BEFORE_KEY, 'true');
  }

  private isLikelyInEurope() {
    return Intl.DateTimeFormat()?.resolvedOptions()?.timeZone?.includes('Europe');
  }
}
