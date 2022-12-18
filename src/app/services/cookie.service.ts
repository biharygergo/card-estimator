import { Injectable } from '@angular/core';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';

const COOKIE_ACCEPTED_KEY = 'cookiesAccepted';

@Injectable({
  providedIn: 'root',
})
export class CookieService {
  showCookieBanner = true;

  constructor(private snackBar: MatSnackBar) {}

  tryShowCookieBanner() {
    if (
      typeof window !== 'undefined' &&
      window?.localStorage &&
      !window.localStorage.getItem(COOKIE_ACCEPTED_KEY)
    ) {
      const snackbarRef = this.snackBar.open(
        'This site uses cookies to analyze traffic and improve your experience. Read more about how cookies are used in our Privacy Policy.',
        'Got it'
      );
      snackbarRef.onAction().subscribe(() => {
        snackbarRef.dismiss();
        window.localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
      });
    }
  }
}
