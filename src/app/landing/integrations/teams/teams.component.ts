import { Component } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { RouterLink } from '@angular/router';
import { FeaturesItemsComponent } from '../../features/features-items/features-items.component';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../../components/page-header-with-cta/page-header-with-cta.component';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss'],
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
  ],
})
export class TeamsComponent {
  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);
}
