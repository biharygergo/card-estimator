import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
  loadVideos = new BehaviorSubject<boolean>(false);

  constructor() {}

  ngOnInit(): void {}

  viewAllFeaturesOpened() {
    this.loadVideos.next(true);
  }
}
