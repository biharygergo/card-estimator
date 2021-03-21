import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare const gtag: any;
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  isScrollDownHidden = false;
  constructor(private router: Router) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  @HostListener('window:scroll', ['$event'])
  onScrollHandler() {
    window.requestAnimationFrame(() => {
      if (window.scrollY === 0) {
        this.isScrollDownHidden = false;
      } else if (window.scrollY > 200) {
        this.isScrollDownHidden = true;
      }
    });
  }

  start() {
    if (gtag) {
      gtag('event', 'conversion', {
        send_to: 'AW-970033218/cXtiCLWunPwBEMKQxs4D',
      });
    }
    this.router.navigate(['join']);
  }

  scrollDown() {
    if (!this.isScrollDownHidden) {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      this.isScrollDownHidden = true;
    }
  }
}
