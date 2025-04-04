import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';
import { FaqSectionComponent } from '../faq/faq-section/faq-section.component';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
@Component({
  selector: 'app-printable-planning-poker-cards',
  imports: [
    MatButtonModule,
    MatExpansionModule,
    RouterLink,
    NgOptimizedImage,
    FaqSectionComponent,
    MatIconModule,
    PageHeaderComponent,
    StartPlanningCtaComponent,
  ],
  templateUrl: './printable-planning-poker-cards.component.html',
  styleUrl: './printable-planning-poker-cards.component.scss',
})
export class PrintablePlanningPokerCardsComponent {
  faqs = [
    {
      question: 'What is included in the printable planning poker cards?',
      answer: 'The printable set includes a complete deck of planning poker cards with the Fibonacci sequence (0, 1, 2, 3, 5, 8, 13) and a "coffee" card for uncertain estimates. The cards are designed to be printed on A4 paper with 8 cards per sheet. There are two sheets of paper, so you can print the cards double-sided with a great backside for printing.'
    },
    {
      question: 'How do I use the printable planning poker cards?',
      answer: 'After printing the cards, cut them out along the provided lines. Each team member should have their own set of cards. During estimation sessions, team members select a card representing their estimate and reveal it simultaneously. If estimates vary significantly, discuss the reasoning behind different estimates to reach a consensus.'
    },
    {
      question: 'Why should I consider using an online planning poker tool?',
      answer: 'While physical cards work well for in-person meetings, online tools like PlanningPoker.live offer several advantages: automatic tracking of estimates, integration with project management tools, support for remote teams, and the ability to save and share estimation history. Plus, it\'s completely free to use!'
    },
    {
      question: 'Can I customize the printable cards?',
      answer: 'The provided PDF is designed to be printed as-is, but you can also use it as a template to create your own custom card sets. If you need more flexibility, consider using PlanningPoker.live which allows you to create and save custom card sets for your team.'
    }
  ];
}
