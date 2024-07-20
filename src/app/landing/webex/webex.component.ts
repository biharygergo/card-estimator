import { Component } from '@angular/core';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor } from '@angular/material/button';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@Component({
    selector: 'app-webex',
    templateUrl: './webex.component.html',
    styleUrls: ['./webex.component.scss'],
    standalone: true,
    imports: [PageHeaderComponent, MatAnchor, MatIcon, MatTabGroup, MatTab, MatDivider, RouterLink, StartPlanningCtaComponent]
})
export class WebexComponent {
  selectedIndex = 0;

}
