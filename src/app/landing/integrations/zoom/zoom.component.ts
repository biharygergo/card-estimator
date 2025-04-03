import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subject, takeUntil, tap } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { FeaturesItemsComponent } from '../../features/features-items/features-items.component';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../../components/page-header-with-cta/page-header-with-cta.component';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';

@Component({
  selector: 'app-zoom',
  templateUrl: './zoom.component.html',
  styleUrls: ['./zoom.component.scss'],
  imports: [
    PageHeaderWithCtaComponent,
    FeaturesPreviewComponent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FeaturesItemsComponent,
    MatTabGroup,
    MatTab,
    MatDivider,
    RouterLink,
    StartPlanningCtaComponent,
    CarbonAdComponent,
    FaqSectionComponent,
  ],
})
export class ZoomComponent implements OnInit, OnDestroy {
  onInstallClicked = new Subject<void>();

  destroy = new Subject<void>();

  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);
  zoomFaqs = [
    {
      question: 'What is Planning Poker in Zoom?',
      answer:
        'Planning Poker in Zoom is an embedded app that lets you run agile estimation sessions directly within your Zoom meetings. Team members can vote, discuss estimates, and reach consensus without leaving the Zoom environment. Check out our <a href="/features">full feature list</a> to learn more.',
    },
    {
      question: 'Why should teams use Planning Poker in Zoom?',
      answer:
        'Using Planning Poker directly in Zoom eliminates the need to switch between different apps during estimation sessions. It seamlessly integrates with your existing workflow, reduces context switching, and keeps everyone focused on the estimation process within your Zoom meeting.',
    },
    {
      question: 'How do I start a Planning Poker session in Zoom?',
      answer:
        'First, install the Planning Poker app from the Zoom marketplace. During a meeting, click Apps and select Planning Poker. Share the app to make it visible to all participants. The room is automatically created and everyone in the meeting can join instantly - no registration required.',
    },
    {
      question: 'Can I use Planning Poker with Jira while in Zoom?',
      answer:
        'Yes! Even when using Planning Poker in Zoom, you can still connect to Jira. Import your backlog items directly into the estimation session and sync story points back to Jira when you\'re done. Visit our <a href="/integrations">integrations page</a> to learn more about connecting Jira.',
    },
    {
      question: 'Is the Zoom app different from the web version?',
      answer:
        'The Zoom app provides the same core functionality as our web version, but optimized for the Zoom environment. You get the same estimation tools, voting systems, and Jira integration, but with the added benefit of staying within your Zoom meeting.',
    },
  ];
  constructor(private readonly analytics: AnalyticsService) {}

  ngOnInit(): void {
    this.onInstallClicked
      .pipe(
        tap(() => {
          this.analytics.logClickedInstallZoomApp('detail_page');
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
