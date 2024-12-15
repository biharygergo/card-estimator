import { Component } from '@angular/core';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { PageHeaderWithCtaComponent } from '../../components/page-header-with-cta/page-header-with-cta.component';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { FeaturesItemsComponent } from '../../features/features-items/features-items.component';
import { FeaturesPreviewComponent } from '../../features/features-preview/features-preview.component';
import { BehaviorSubject } from 'rxjs';
import { NgOptimizedImage } from '@angular/common';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';

@Component({
  selector: 'app-meet',
  standalone: true,
  imports: [
    PageHeaderWithCtaComponent,
    FeaturesPreviewComponent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FeaturesItemsComponent,
    RouterLink,
    MatTabGroup,
    MatTab,
    StartPlanningCtaComponent,
    NgOptimizedImage,
    CarbonAdComponent,
  ],
  templateUrl: './meet.component.html',
  styleUrl: '../teams/teams.component.scss',
})
export class MeetComponent {
  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);
}
