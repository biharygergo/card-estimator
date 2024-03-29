import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  companies = [
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
    'siemens',
    'trustly',
    'loreal',
    'betsson',
    'algolia',
    'allianz',
    // Repeat the first six
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
  ];
  logos = this.companies.map((company) => `${company}_logo`);
  isOnLandingPage = inject(ActivatedRoute).url.pipe(
    map((segments) => segments.length === 0)
  );

  constructor() {}

  ngOnInit(): void {}
}
