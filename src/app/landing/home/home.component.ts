import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { NgOptimizedImage } from '@angular/common';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatIcon } from '@angular/material/icon';
import {
  MatButton,
  MatButtonModule,
  MatFabButton,
} from '@angular/material/button';
import { FeaturesItemsComponent } from '../features/features-items/features-items.component';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle,
  MatAccordion,
} from '@angular/material/expansion';
import { FeaturesPreviewComponent } from '../features/features-preview/features-preview.component';
import { PageHeaderWithCtaComponent } from '../components/page-header-with-cta/page-header-with-cta.component';
import { RouterLink } from '@angular/router';
import { FaqRowComponent } from '../faq/faq-row/faq-row.component';

const KNOWLEDGE_BASE_SAMPLES = [
  {
    title:
      'The Definitive Guide to Planning Poker - Master Agile Estimation Poker Techniques',
    description:
      'Master Agile estimation with our simple guide to Planning Poker, also known as Agile Poker or Scrum Poker. Discover how this powerful tool enhances team collaboration, accuracy, and project success.',
    imageId: 'pexels-fauxels-3183197_k4uned',
    imageAlt: 'People at a meeting table',
    slug: 'planning-poker-guide-agile-estimation-techniques',
  },
  {
    title: '5 Essential Scrum Master Tools to Empower Your Agile Team',
    description:
      "Discover the top 5 must-have tools that every Scrum Master needs to streamline processes, boost collaboration, and drive project success. From project management to retrospectives, we've got you covered.",
    imageId: 'Feautres_Zoom_fkn3mh',
    imageAlt: 'Application logos scattered',
    slug: 'essential-scrum-master-tools',
  },
  {
    title: 'Guide to Installing Planning Poker in Microsoft Teams',
    description:
      "Explore step-by-step instructions for integrating Planning Poker into Microsoft Teams. Enhance your team's estimation process with this comprehensive installation guide.",
    imageId: 'Instruction_Teams_3_h61ccs',
    imageAlt: 'PlanningPoker.live running in Teams',
    slug: 'installing-planning-poker-microsoft-teams-guide',
  },
];

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    PageHeaderWithCtaComponent,
    FeaturesPreviewComponent,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    FeaturesItemsComponent,
    MatFabButton,
    MatIcon,
    MatTabGroup,
    MatTab,
    MatAccordion,
    MatButtonModule,
    NgOptimizedImage,
    CarbonAdComponent,
    RouterLink,
    FaqRowComponent,
  ],
})
export class HomeComponent implements OnInit {
  companies = [
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
    'siemens',
    'trustly',
    'loreal',
    'betsson',
    'algolia',
    'allianz',
    // Repeat the first six
    'comcast',
    'motorola',
    'google',
    'netflix',
    'prezi',
    'amazon',
  ];
  logos = this.companies.map((company) => `${company}_logo`);
  loadVideos = new BehaviorSubject<boolean>(false);
  protected knowledgeBaseSamples = KNOWLEDGE_BASE_SAMPLES;
  faqs = [
    {
      question: 'What is Planning Poker and how does it work?',
      answer:
        'Planning Poker is an agile estimation technique where team members independently vote on the complexity of user stories using numbered cards. PlanningPoker.live makes this process easy and free - team members vote simultaneously, discuss their estimates, and reach consensus, all in real-time. Check out our <a href="/features">full feature list</a> to learn more.',
    },
    {
      question: 'Why should teams use Planning Poker for estimating?',
      answer:
        'Planning Poker helps teams estimate more accurately by reducing bias and encouraging participation from all team members. It\'s trusted by agile teams at companies like Google, Netflix, Amazon, and Siemens because it leads to better estimates, more engaged discussions, and helps identify potential risks early in the planning process.',
    },
    {
      question: 'How do I run a Planning Poker session with my remote team?',
      answer:
        'Start by clicking "Start planning" or <a href="/create">create a room here</a>. Share the room link with your team - no registration required. Rooms are public by default for easy access, but can be password-protected or restricted to organization members. Use our integrations with Microsoft Teams, Google Meet, Zoom, or Webex to make remote planning sessions seamless.',
    },
    {
      question: 'Can I use Planning Poker with Jira or other agile tools?',
      answer:
        'Yes! PlanningPoker.live integrates directly with Jira and Linear. You can import user stories, conduct estimation sessions, and automatically sync story points back to your project management tool. Visit our <a href="/integrations">integrations page</a> to connect your favorite tools.',
    },
    {
      question: 'What story point scales are available in Planning Poker?',
      answer:
        'We offer multiple estimation scales including the Fibonacci sequence (1, 2, 3, 5, 8, 13...), Modified Fibonacci, T-shirt sizes (XS, S, M, L, XL), and Powers of 2 (1, 2, 4, 8, 16). You can also create custom card sets to match your team\'s preferred estimation scale. Learn more about setting up custom card sets in our <a href="/knowledge-base/maximize-estimation-with-different-card-sets-in-planningpoker-live">knowledge base</a>.',
    },
    {
      question: 'How private are Planning Poker sessions?',
      answer:
        'By default, rooms are public and accessible via URL for maximum convenience. The generated room IDs are unique and are difficult to guess. For teams requiring additional privacy, you can enable password protection or restrict access to organization members. We only store the minimum amount of data required to provide the service and encrypt all data in transit and at rest.',
    },
    {
      question: 'How do I facilitate effective Planning Poker sessions as a Scrum Master?',
      answer:
        'As a Scrum Master, start by ensuring all participants understand the user story and acceptance criteria before voting. Use our timer feature to keep discussions focused, and leverage the statistics feature to prompt meaningful discussions about estimate differences. For distributed teams, use our video integration features to maintain face-to-face communication. Check out our <a href="/knowledge-base/planning-poker-guide-agile-estimation-techniques">Scrum Master\'s guide</a> for more facilitation tips.',
    }
  ];
  constructor() {}

  ngOnInit(): void {}

  viewAllFeaturesOpened() {
    this.loadVideos.next(true);
  }
}
