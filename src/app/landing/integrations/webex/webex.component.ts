import { Component } from '@angular/core';
import { StartPlanningCtaComponent } from '../../components/start-planning-cta/start-planning-cta.component';
import { RouterLink } from '@angular/router';
import { MatDivider } from '@angular/material/divider';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import { MatAnchor } from '@angular/material/button';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';
import { FaqSectionComponent } from '../../faq/faq-section/faq-section.component';

@Component({
  selector: 'app-webex',
  templateUrl: './webex.component.html',
  styleUrls: ['./webex.component.scss'],
  imports: [
    PageHeaderComponent,
    MatAnchor,
    MatIcon,
    MatTabGroup,
    MatTab,
    MatDivider,
    RouterLink,
    StartPlanningCtaComponent,
    CarbonAdComponent,
    FaqSectionComponent,
  ],
})
export class WebexComponent {
  selectedIndex = 0;

  webexFaqs = [
    {
      question: 'What is Planning Poker in Webex?',
      answer:
        'Planning Poker in Webex is an embedded app that lets you run agile estimation sessions directly within your Webex meetings. Team members can vote, discuss estimates, and reach consensus without leaving Webex. Check out our <a href="/features">full feature list</a> to learn more.',
    },
    {
      question: 'Why should teams use Planning Poker in Webex?',
      answer:
        'Using Planning Poker directly in Webex eliminates the need to switch between different apps during estimation sessions. It seamlessly integrates with your existing workflow, reduces context switching, and keeps everyone focused on the estimation process within your Webex meeting.',
    },
    {
      question: 'How do I start a Planning Poker session in Webex?',
      answer:
        'First, install the Planning Poker app from the Webex App Hub. During a meeting, open the Apps panel and select Planning Poker. Share the app to make it visible to all participants. The room is automatically created and everyone in the meeting can join instantly - no registration required.',
    },
    {
      question: 'Can I use Planning Poker with Jira while in Webex?',
      answer:
        'Yes! Even when using Planning Poker in Webex, you can still connect to Jira. Import your backlog items directly into the estimation session and sync story points back to Jira when you\'re done. Visit our <a href="/integrations">integrations page</a> to learn more about connecting Jira.',
    },
    {
      question: 'Is the Webex app different from the web version?',
      answer:
        'The Webex app provides the same core functionality as our web version, but optimized for the Webex environment. You get the same estimation tools, voting systems, and Jira integration, but with the added benefit of staying within your Webex meeting.',
    },
  ];
}
