import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

declare const gtag: any;
@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
})
export class LandingComponent implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {}

  start() {
    if (gtag) {
      gtag('event', 'conversion', {
        send_to: 'AW-970033218/cXtiCLWunPwBEMKQxs4D',
      });
    }
    this.router.navigate(['join']);
  }
}
