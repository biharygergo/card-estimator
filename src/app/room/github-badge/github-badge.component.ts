import { Component, OnInit } from '@angular/core';
import { AnalyticsService } from './../../services/analytics.service';

@Component({
  selector: 'app-github-badge',
  templateUrl: './github-badge.component.html',
  styleUrls: ['./github-badge.component.scss'],
  standalone: true,
})
export class GithubBadgeComponent implements OnInit {
  constructor(private analytics: AnalyticsService) {}

  ngOnInit(): void {}

  onClick() {
    this.analytics.logClickedGithubLink();
  }
}
