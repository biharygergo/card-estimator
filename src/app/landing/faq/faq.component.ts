import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle } from '@angular/material/expansion';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

type FaqRow = {
  question: string;
  answer: string;
  category: string;
};

const faqs: FaqRow[] = [
  {
    question: 'How can I start a new planning poker session?',
    answer:
      'To start a new planning poker session, click on "Start planning" in the header or just <a href="/create">click here to start a new session</a>. This will take you to the session creation page where you can set up your session details and choose your participation mode.',
    category: 'Registration',
  },
  {
    question: 'How can I add colleagues to a session?',
    category: 'Registration',
    answer:
      'You can add colleagues to a session by clicking on the "Invite others" button. Alternatively, you can send them the URL from your browser\'s address bar. They\'ll be able to join the session instantly and participate in the voting process.',
  },
  {
    question: 'How many colleagues can join a planning session?',
    category: 'Registration',
    answer:
      'There are no limits to the number of voters currently, so all of your team can join. This ensures that everyone can participate in the estimation process, regardless of team size.',
  },
  {
    question: 'How can I modify the cards available to vote on?',
    category: 'Gameplay',
    answer:
      'To modify the cards available to vote on, click the "Choose cards" button. You\'ll be able to select from a variety of card layouts available, including t-shirt sizing. If none suit your needs, you can even create a custom card set that fits your team.',
  },
  {
    question: 'How can I start a new round?',
    category: 'Gameplay',
    answer:
      'To start a new round, click on "New round" in the top right corner of the game screen. A new round will be created. Alternatively, you can click "Manage Rounds" in the top right corner to create multiple topics in advance or modify the voting order.',
  },
  {
    question: 'Can I add topics/issues in advance?',
    category: 'Gameplay',
    answer:
      'Yes, you can add topics/issues in advance. Click "Manage Rounds" in the top right corner to create multiple topics in advance or modify the voting order. If you need to revote or change the active topic, use the dropdown menu on the round/topic card in the sidebar.',
  },
  {
    question: 'How can I view the results of the vote?',
    category: 'Gameplay',
    answer:
      'To view the results of the vote, click "Reveal Votes" on the top of the game screen. All votes will become visible, allowing you to see the team\'s estimations.',
  },
  {
    question: 'How can I view the results of previous rounds?',
    category: 'Gameplay',
    answer:
      'You can view the results of previous rounds by clicking "Manage Rounds" in the top right corner of the screen. This section shows the overall results and statistics of each round. You can view more details by clicking "Details" from the menu on the given round.',
  },
  {
    question:
      'How can I enable/disable notification sounds when a new round is started?',
    category: 'Gameplay',
    answer:
      'You can enable sounds with the "Sounds" button or disable them with the "Mute" button under the room ID on the left side. This allows you to customize your notification preferences during the session.',
  },
  {
    question: 'How can I restart a previous round?',
    category: 'Gameplay',
    answer:
      'To restart a previous round, go to the "Manage Rounds" section, click on the menu icon "..." on the round you\'d like to restart, and click "Revote". This will clear previous votes and set the round as the currently active one.',
  },
  {
    question: 'How can I start the countdown timer?',
    category: 'Gameplay',
    answer:
      'The countdown timer is located in the right column of the app, under the main game buttons. To start a 30-second timer, just press "Start". If you wish to set a longer timer, press "+30s", which will add 30 seconds to the timer. You can pause and reset the timer once it has started. The timer will automatically start for all members of the room.',
  },
  {
    question: 'How can I contribute to the development of this app?',
    category: 'Privacy',
    answer:
      'To contribute to the development of this app, open the <a href="https://github.com/biharygergo/card-estimator" target="_blank">repository</a> of this project, give it a star, fork it, and add a new feature! Contributions from the community are always welcome.',
  },
  {
    question: 'How is my voting data stored? How long is it kept?',
    category: 'Privacy',
    answer:
      'Your voting data (name of the voter, vote, topic name) is stored in Google Firestore and is encrypted at rest. You can request deletion of your data at any time by contacting the developers. This ensures your data is secure and can be managed according to your preferences.',
  },
  {
    question: 'How can I view the velocity of my team?',
    category: 'Gameplay',
    answer:
      'Velocity data is shown in the sidebar and is available after results have been revealed. Velocity calculation works with numbered card sets only. This helps you track your team\'s progress and improve future estimations.',
  },
  {
    question: 'How are rooms protected? Can I set a password?',
    category: 'Privacy',
    answer:
      'By default, rooms are protected via obfuscation: room IDs are hard to guess as they are generated randomly. For increased protection, you can enable password protection on rooms you create. This adds an extra layer of security to your sessions.',
  },
  {
    question: 'How can I create a team?',
    category: 'Gameplay',
    answer:
      'A team or an "organization" allows you to add frequent members to a group and enhance the planning experience. You can create an organization from the "My Organization" menu. This feature helps streamline the planning process for recurring team members.',
  },
  {
    question: 'How can I integrate Planning Poker with Microsoft Teams?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Microsoft Teams, visit the <a href="https://planningpoker.live/integrations/teams">Microsoft Teams integration page</a>. Follow the step-by-step instructions to install the Planning Poker app in Teams. This integration allows you to conduct estimation sessions directly within your Teams meetings.',
  },
  {
    question: 'How can I integrate Planning Poker with Zoom?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Zoom, visit the <a href="https://planningpoker.live/integrations/zoom">Zoom integration page</a>. Follow the instructions to install the Planning Poker app in Zoom. This integration enables seamless planning sessions within your Zoom meetings.',
  },
  {
    question: 'How can I integrate Planning Poker with Google Meet?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Google Meet, visit the <a href="https://planningpoker.live/integrations/meet">Google Meet integration page</a>. Follow the guide to install the Planning Poker app in Google Meet. This integration helps you run effective planning sessions within your Meet meetings.',
  },
  {
    question: 'How can I integrate Planning Poker with Webex?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Webex, visit the <a href="https://planningpoker.live/integrations/webex">Webex integration page</a>. Follow the steps to install the Planning Poker app in Webex. This integration allows you to conduct planning sessions directly within your Webex meetings.',
  },
  {
    question: 'How can I integrate Planning Poker with Jira?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Jira, visit the <a href="https://planningpoker.live/integrations/jira">Jira integration page</a>. Follow the step-by-step instructions to install the Planning Poker app in Jira. This integration allows you to conduct estimation sessions directly within your Jira projects.',
  },
  {
    question: 'How can I integrate Planning Poker with Linear?',
    category: 'Integration',
    answer:
      'To integrate Planning Poker with Linear, visit the <a href="https://planningpoker.live/integrations/linear">Linear integration page</a>. Follow the instructions to install the Planning Poker app in Linear. This integration enables seamless planning sessions within your Linear workspace.',
  },
  {
    question: 'How can I select tickets from Jira or Linear?',
    category: 'Gameplay',
    answer:
      'To select tickets from Jira or Linear, use the topic editor in your Planning Poker session. You can search for specific issues by title or ID, or select from your recent history. This allows you to easily add relevant issues to your estimation session.',
  },
  {
    question: 'How can I import tickets in batch from Jira or Linear?',
    category: 'Gameplay',
    answer:
      'To import tickets in batch from Jira or Linear, open the sidebar and click on "Import/Export". Select "Batch Import Issues" and apply filters to find the relevant issues, such as filtering by project or sprint. Once you\'ve selected multiple tickets, click "Import" to add them all to your current estimation session.',
  },
  {
    question: 'How can I take notes during a session?',
    category: 'Gameplay',
    answer:
      'To take notes during a session, click on the "Notes" field under room members. These notes are saved automatically and can be accessed by all participants in the room.',
  },
  {
    question: 'How can I select or change my avatar?',
    category: 'Gameplay',
    answer:
      'To select or change your avatar, click on your initials next to your name in the Members section. You can choose from a variety of avatars for a memorable planning session.',
  },
  {
    question: 'How can I manage room permissions?',
    category: 'Gameplay',
    answer:
      'To manage room permissions, click on the "Security and permissions" button in the room settings. Here you can set permissions for different roles, such as who can start a new round or reveal votes.',
  },
  {
    question: 'How can I enable room security features?',
    category: 'Gameplay',
    answer:
      'To enable room security features, go to the room settings and click on "Security and permissions". You can enable password protection or restrict access to members of your organization only.',
  },
  {
    question: 'How can I create an organization?',
    category: 'Organizations',
    answer:
      'To create an organization, go to the "My Organization" menu and click on "Create Organization". Fill in the required details and invite your team members to join.',
  },
  {
    question: 'What are the benefits of creating an organization?',
    category: 'Organizations',
    answer:
      'Creating an organization allows you to manage your team more effectively. You can set up recurring meetings, manage permissions, and ensure that only authorized members can access your rooms.',
  },
  {
    question: 'How can I create a meeting link?',
    category: 'Meeting Links',
    answer:
      'To create a meeting link, go to the "Meeting Links" section and click on "Create Link". This link will always redirect to the latest room, making it easy for participants to join the correct session.',
  },
  {
    question: 'How can I manage my meeting links?',
    category: 'Meeting Links',
    answer:
      'To manage your meeting links, go to the "Meeting Links" section. Here you can view all your links, create new ones, or delete existing ones. You can also see which room each link currently points to.',
  }
];

type FaqCategory = {
  category: string;
  faqs: FaqRow[];
};

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    styleUrls: ['./faq.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        PageHeaderComponent,
        MatAccordion,
        MatExpansionPanel,
        MatExpansionPanelHeader,
        MatExpansionPanelTitle,
        StartPlanningCtaComponent,
        CarbonAdComponent,
    ],
})
export class FaqComponent implements OnInit {
  categories: FaqCategory[] = Object.values(
    faqs.reduce((acc: { [category: string]: FaqCategory }, curr: FaqRow) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { faqs: [], category: curr.category };
      }
      acc[curr.category].faqs.push(curr);
      return acc;
    }, {})
  ).sort((a, b) => a.category.localeCompare(b.category));

  constructor() {}

  ngOnInit(): void {}
}