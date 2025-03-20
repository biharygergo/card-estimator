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
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';

@Component({
    selector: 'app-teams',
    templateUrl: './teams.component.html',
    styleUrls: ['./teams.component.scss'],
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
        CarbonAdComponent,
        FaqSectionComponent
    ]
})
export class TeamsComponent {
  selectedIndex = 0;
  loadVideos = new BehaviorSubject(false);
  teamsFaqs = [
    {
      question: 'What is Planning Poker in Microsoft Teams?',
      answer: 'Planning Poker in Microsoft Teams is an embedded app that lets you run agile estimation sessions directly within your Teams meetings. Teams members can vote, discuss estimates, and reach consensus without leaving the meeting environment. Check out our <a href="/features">full feature list</a> to learn more.',
    },
    {
      question: 'Why should teams use Planning Poker in Microsoft Teams?',
      answer: 'Using Planning Poker directly in Microsoft Teams eliminates the need to switch between different apps during estimation sessions. It\'s trusted by agile teams because it seamlessly integrates with your existing workflow, reduces context switching, and keeps everyone focused on the estimation process.',
    },
    {
      question: 'How do I start a Planning Poker session in Microsoft Teams?',
      answer: 'First, install the Planning Poker app from the Teams store. During a meeting, click the Apps button and select Planning Poker. Share the app to make it visible to all participants. The room is automatically created and everyone in the meeting can join instantly - no registration required.',
    },
    {
      question: 'Can I use Planning Poker with Jira or Linear while in Teams?',
      answer: 'Yes! Even when using Planning Poker in Teams, you can still connect to Jira or Linear. Import your backlog items directly into the estimation session and sync story points back to your project management tool when you\'re done. Visit our <a href="/integrations">integrations page</a> to learn more about connecting Jira or Linear.',
    },
    {
      question: 'Is the Teams app different from the web version?',
      answer: 'The Teams app provides the same core functionality as our web version, but optimized for the Teams environment. You get the same estimation tools, voting systems, and Jira integration, but with the added benefit of staying within your Teams meeting.',
    }
  ];
}
