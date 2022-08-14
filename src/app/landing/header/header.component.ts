import { ɵparseCookieValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const COOKIE_ACCEPTED_KEY = 'cookiesAccepted';
@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  isOpen = false;
  showCookieBanner = true;
  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    if (
      typeof window !== 'undefined' &&
      window?.localStorage &&
      !window.localStorage.getItem(COOKIE_ACCEPTED_KEY)
    ) {
      const snackbarRef = this.snackBar.open(
        `This site uses cookies to analyze traffic and improve your experience.`,
        'Got it'
      );
      snackbarRef.onAction().subscribe(() => {
        snackbarRef.dismiss();
        window.localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
      });
    }
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
  }
}
