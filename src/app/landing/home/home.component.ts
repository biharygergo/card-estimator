import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';
import { FeaturesItemsComponent } from '../features/features-items/features-items.component';
import { MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle, MatAccordion } from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../components/page-header-with-cta/page-header-with-cta.component';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        PageHeaderWithCtaComponent,
        FeaturesPreviewComponent,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        FeaturesItemsComponent,
        MatFabButton,
        MatIcon,
        MatTabGroup,
        MatTab,
        MatAccordion,
        NgOptimizedImage,
        CarbonAdComponent,
    ],
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
