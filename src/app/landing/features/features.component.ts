import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { FeaturesItemsComponent } from './features-items/features-items.component';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@Component({
    selector: 'app-features',
    templateUrl: './features.component.html',
    styleUrls: ['./features.component.scss'],
    imports: [PageHeaderComponent, FeaturesItemsComponent, StartPlanningCtaComponent, CarbonAdComponent]
})
export class FeaturesComponent implements OnInit {

  readonly of = of;
  constructor() { }

  ngOnInit(): void {
  }

}
