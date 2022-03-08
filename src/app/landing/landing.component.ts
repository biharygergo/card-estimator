import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnalyticsService } from '../services/analytics.service';

declare const gtag: any;
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  isScrollDownHidden = false;
  constructor(private router: Router, private analytics: AnalyticsService) {}

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
    this.analytics.logClickedStartPlanning();
    this.router.navigate(['join']);
  }

  scrollDown() {
    if (!this.isScrollDownHidden) {
      window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      this.isScrollDownHidden = true;
    }
  }
}
