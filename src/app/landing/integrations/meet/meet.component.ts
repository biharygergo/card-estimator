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
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';

@Component({
  selector: 'app-meet',
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
    FaqSectionComponent,
  ],
  templateUrl: './meet.component.html',
  styleUrl: '../teams/teams.component.scss',
})
export class MeetComponent {
  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);

  meetFaqs = [
    {
      question: 'What is Planning Poker in Google Meet?',
      answer:
        'Planning Poker in Google Meet is an embedded app that lets you run agile estimation sessions directly within your Meet conferences. Team members can vote, discuss estimates, and reach consensus without leaving Meet. Check out our <a href="/features">full feature list</a> to learn more.',
    },
    {
      question: 'Why should teams use Planning Poker in Google Meet?',
      answer:
        'Using Planning Poker directly in Google Meet eliminates the need to switch between different apps during estimation sessions. It seamlessly integrates with your existing workflow, reduces context switching, and keeps everyone focused on the estimation process within your Meet conference.',
    },
    {
      question: 'How do I start a Planning Poker session in Google Meet?',
      answer:
        'During a Meet conference, click the Activities button (diamond icon) and select Planning Poker. The app will open in the side panel for all participants. The room is automatically created and everyone in the meeting can join instantly - no registration required.',
    },
    {
      question: 'Can I use Planning Poker with Jira while in Google Meet?',
      answer:
        'Yes! Even when using Planning Poker in Google Meet, you can still connect to Jira. Import your backlog items directly into the estimation session and sync story points back to Jira when you\'re done. Visit our <a href="/integrations">integrations page</a> to learn more about connecting Jira.',
    },
    {
      question: 'Is the Google Meet app different from the web version?',
      answer:
        'The Google Meet app provides the same core functionality as our web version, but optimized for the Meet environment. You get the same estimation tools, voting systems, and Jira integration, but with the added benefit of staying within your Meet conference.',
    },
  ];
}
