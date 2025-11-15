import { Component, OnInit, AfterViewInit, ViewEncapsulation, inject, Renderer2, ElementRef, ViewChild } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink, Router } from '@angular/router';
import { CarbonAdComponent } from '../../shared/carbon-ad/carbon-ad.component';
import { StartPlanningCtaComponent } from '../components/start-planning-cta/start-planning-cta.component';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { SchemaTagService } from '../../services/schema-tag.service';
import { GlossaryLinkComponent } from '../../shared/glossary-link/glossary-link.component';
import { WithContext } from 'schema-dts';
import { FAQPage } from 'schema-dts';
import { DOCUMENT } from '@angular/common';

export interface GlossaryTerm {
  term: string;
  definition: string;
  relatedTerms?: string[];
}

@Component({
  selector: 'app-glossary',
  templateUrl: './glossary.component.html',
  styleUrls: ['./glossary.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    PageHeaderComponent,
    StartPlanningCtaComponent,
    CarbonAdComponent,
    RouterLink,
  ],
})
export class GlossaryComponent implements OnInit {
  private readonly metaService = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly schemaTagService = inject(SchemaTagService);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  @ViewChild('glossarySection', { static: false }) glossarySection?: ElementRef<HTMLElement>;

  terms: GlossaryTerm[] = [
    {
      term: 'Planning Poker',
      definition: 'Planning Poker (also known as Scrum Poker) is a consensus-based estimation technique used in Agile software development. Team members use physical or digital cards with numbers representing story points or effort estimates. Each member privately selects a card, and when revealed simultaneously, the team discusses discrepancies to reach a consensus on the estimate. This technique helps prevent anchoring bias and encourages team discussion about the work involved.',
      relatedTerms: ['Story Point', 'Fibonacci Sequence', 'Scrum', 'Agile Estimation'],
    },
    {
      term: 'Story Point',
      definition: 'A Story Point is a unit of measure used in Agile project management to express the overall effort required to fully implement a product backlog item or any other piece of work. Unlike time-based estimates (hours or days), story points represent relative complexity, effort, and risk. A story point is a relative measure, meaning a task estimated as 2 story points should be twice as complex, effort-intensive, or risky as a task estimated as 1 story point. Teams often use the Fibonacci sequence (1, 2, 3, 5, 8, 13, etc.) or modified Fibonacci sequence for story point estimation.',
      relatedTerms: ['Velocity', 'Fibonacci Sequence', 'Planning Poker', 'Product Backlog'],
    },
    {
      term: 'Velocity',
      definition: 'Velocity is a metric in Agile project management that measures the amount of work a team can complete during a single sprint or iteration. It\'s typically calculated by summing the story points of all completed user stories or product backlog items in a sprint. Velocity helps teams predict how much work they can accomplish in future sprints and enables more accurate sprint planning. Velocity is team-specific and should not be compared between teams, as it reflects each team\'s unique capacity and estimation scale.',
      relatedTerms: ['Story Point', 'Sprint', 'Burndown Chart', 'Capacity Planning'],
    },
    {
      term: 'Fibonacci Sequence',
      definition: 'The Fibonacci Sequence (1, 2, 3, 5, 8, 13, 21, 34, 55, 89...) is commonly used in Planning Poker and Agile estimation because it reflects the uncertainty in larger estimates. As estimates grow, the gaps between numbers increase, which aligns with the reality that larger tasks are harder to estimate precisely. Many teams use a modified Fibonacci sequence (1, 2, 3, 5, 8, 13, 20, 40, 100) or even custom sequences like T-shirt sizes (XS, S, M, L, XL). The Fibonacci sequence helps teams avoid false precision and acknowledges that estimates become less accurate as they increase.',
      relatedTerms: ['Planning Poker', 'Story Point', 'T-Shirt Sizing'],
    },
    {
      term: 'Affinity Estimation',
      definition: 'Affinity Estimation is a collaborative Agile estimation technique where team members group user stories or tasks by relative size without assigning specific numbers. The team silently places items on a wall or board, arranging them from smallest to largest. Items are discussed and moved until the team reaches consensus on the relative ordering. This method is useful for initial backlog refinement and helps teams quickly estimate large numbers of items. It\'s often followed by more precise estimation techniques like Planning Poker for critical items.',
      relatedTerms: ['Planning Poker', 'Story Point', 'T-Shirt Sizing', 'Backlog Refinement'],
    },
    {
      term: 'Planning Poker Observer',
      definition: 'A Planning Poker Observer is a non-voting participant in a Planning Poker session who watches the estimation process but doesn\'t cast votes. Observers might be stakeholders, product managers, or team members who want to learn about the process without influencing the estimates. Some Planning Poker tools allow observers to view real-time voting without revealing their identity to voting participants. This role is useful for transparency and knowledge sharing while maintaining the integrity of the estimation process.',
      relatedTerms: ['Planning Poker', 'Scrum Master', 'Product Owner'],
    },
    {
      term: 'Coffee Card',
      definition: 'The Coffee Card (often represented as ☕ or a coffee cup icon) in Planning Poker is used when a team member needs a break, feels unclear about the requirements, or believes they cannot provide a meaningful estimate at that moment. It\'s essentially a "pass" or "I need more information" card that signals to the team that discussion is needed before estimation can proceed. This card helps teams identify when requirements are unclear and prevents rushed or uninformed estimates.',
      relatedTerms: ['Planning Poker', 'Planning Poker Observer', 'Question Card'],
    },
    {
      term: 'Question Card',
      definition: 'The Question Card (often represented as ❓ or a question mark) in Planning Poker is used when a team member has questions about the user story or task being estimated. It signals that clarification is needed before an estimate can be provided. This card encourages teams to discuss requirements and assumptions, leading to better understanding and more accurate estimates. It\'s different from the Coffee Card, which typically indicates a break is needed rather than a specific question.',
      relatedTerms: ['Planning Poker', 'Coffee Card', 'Story Point'],
    },
    {
      term: 'Sprint',
      definition: 'A Sprint (also called an Iteration) is a fixed-length time-boxed period during which a Scrum team works to complete a set amount of work. Sprints typically last 1-4 weeks, with 2 weeks being the most common. During a sprint, the team commits to completing specific user stories or product backlog items, holds daily standups, and ends with a sprint review and retrospective. Sprints help teams maintain a sustainable pace and provide regular opportunities for inspection and adaptation.',
      relatedTerms: ['Velocity', 'Sprint Planning', 'Scrum', 'Product Backlog'],
    },
    {
      term: 'Sprint Planning',
      definition: 'Sprint Planning is a Scrum ceremony where the team determines what work will be accomplished during the upcoming sprint. The team reviews the product backlog, selects items they can commit to completing, and breaks down larger items into smaller tasks if needed. Planning Poker is commonly used during sprint planning to estimate user stories. The output of sprint planning is a sprint goal and a sprint backlog containing the selected items and tasks.',
      relatedTerms: ['Sprint', 'Planning Poker', 'Product Backlog', 'Velocity'],
    },
    {
      term: 'Product Backlog',
      definition: 'The Product Backlog is an ordered list of everything that might be needed in the product, maintained by the Product Owner. It\'s a living document that evolves as the product and business environment change. Items in the product backlog are prioritized with the most valuable items at the top. The product backlog contains user stories, features, bugs, technical work, and knowledge acquisition activities. Estimation techniques like Planning Poker help determine the size of backlog items.',
      relatedTerms: ['Story Point', 'Product Owner', 'Sprint Planning', 'User Story'],
    },
    {
      term: 'User Story',
      definition: 'A User Story is a simple, informal description of a software feature written from the perspective of the end user. It typically follows the format: "As a [type of user], I want [an action] so that [a benefit/value]." User stories are the primary way of capturing requirements in Agile development and serve as the basis for estimation in Planning Poker. They\'re meant to be small enough to be completed in a single sprint and large enough to deliver value to users.',
      relatedTerms: ['Story Point', 'Product Backlog', 'Sprint', 'Acceptance Criteria'],
    },
    {
      term: 'Scrum',
      definition: 'Scrum is an Agile framework for developing, delivering, and sustaining complex products. It provides a structure for teams to work together effectively through defined roles (Product Owner, Scrum Master, Development Team), ceremonies (Sprint Planning, Daily Standup, Sprint Review, Retrospective), and artifacts (Product Backlog, Sprint Backlog, Increment). Planning Poker is commonly used within Scrum for estimating product backlog items during sprint planning and backlog refinement.',
      relatedTerms: ['Planning Poker', 'Sprint', 'Product Owner', 'Scrum Master'],
    },
    {
      term: 'Agile Estimation',
      definition: 'Agile Estimation refers to the practice of estimating the effort, complexity, or size of work items in Agile software development. Unlike traditional estimation that focuses on time (hours or days), Agile estimation typically uses relative sizing techniques like story points, T-shirt sizes, or Planning Poker. The goal is to make reasonably accurate predictions about capacity and delivery timelines while acknowledging uncertainty. Common Agile estimation techniques include Planning Poker, Affinity Estimation, Bucket System, and Dot Voting.',
      relatedTerms: ['Planning Poker', 'Story Point', 'Affinity Estimation', 'Velocity'],
    },
    {
      term: 'T-Shirt Sizing',
      definition: 'T-Shirt Sizing is an Agile estimation technique that uses relative sizes (XS, S, M, L, XL, XXL) instead of numbers to estimate work items. This approach is intuitive and less intimidating than numeric estimation, making it useful for initial rough estimates or when working with non-technical stakeholders. T-shirt sizes are often later converted to story points for velocity tracking. This technique works well for Affinity Estimation sessions and is a good starting point before using more precise techniques like Planning Poker.',
      relatedTerms: ['Affinity Estimation', 'Story Point', 'Planning Poker', 'Agile Estimation'],
    },
    {
      term: 'Burndown Chart',
      definition: 'A Burndown Chart is a visual tool used in Agile project management to track the progress of work remaining in a sprint or release. The chart shows time on the horizontal axis and work remaining (often in story points) on the vertical axis. An ideal burndown line shows steady progress toward zero remaining work. Actual progress is plotted daily, and comparing the actual line to the ideal line helps teams identify if they\'re on track to complete sprint goals. Burndown charts complement velocity metrics in tracking team performance.',
      relatedTerms: ['Velocity', 'Sprint', 'Story Point'],
    },
    {
      term: 'Scrum Master',
      definition: 'The Scrum Master is a servant-leader for the Scrum team who helps ensure the team follows Scrum practices, removes impediments, and facilitates Scrum ceremonies. In Planning Poker sessions, the Scrum Master often facilitates the discussion, ensures all team members participate, and helps resolve disagreements. The Scrum Master is responsible for protecting the team from outside distractions and helping maintain focus during estimation and sprint execution.',
      relatedTerms: ['Scrum', 'Planning Poker', 'Product Owner', 'Sprint'],
    },
    {
      term: 'Product Owner',
      definition: 'The Product Owner is responsible for maximizing the value of the product resulting from the work of the Scrum team. They manage the product backlog, prioritize items, and clarify requirements. During Planning Poker sessions, the Product Owner presents user stories, answers questions about requirements, and accepts estimates. However, the Product Owner typically doesn\'t vote in Planning Poker to avoid influencing the development team\'s estimates. Their role is to clarify requirements, not to estimate.',
      relatedTerms: ['Product Backlog', 'User Story', 'Planning Poker', 'Scrum'],
    },
    {
      term: 'Anchoring Bias',
      definition: 'Anchoring Bias is a cognitive bias where individuals rely too heavily on the first piece of information (the "anchor") when making decisions. In estimation, this can occur if someone states their estimate first, influencing others to adjust their estimates toward that number. Planning Poker helps mitigate anchoring bias by having all team members select and reveal their estimates simultaneously, preventing early estimates from influencing others. This is one of the key benefits of using Planning Poker over sequential estimation methods.',
      relatedTerms: ['Planning Poker', 'Agile Estimation'],
    },
    {
      term: 'Wideband Delphi',
      definition: 'Wideband Delphi is an estimation technique that Planning Poker is based on. It involves multiple rounds of anonymous estimation followed by discussion, with the goal of reaching consensus. Planning Poker simplifies Wideband Delphi by using cards with pre-determined values (like Fibonacci numbers) instead of free-form estimates. The technique was developed by Barry Boehm and refined to be more collaborative and less time-consuming than the original Delphi method, making it practical for Agile teams.',
      relatedTerms: ['Planning Poker', 'Delphi Method', 'Consensus Building'],
    },
  ];

  ngOnInit(): void {
    this.titleService.setTitle('Planning Poker & Agile Estimation Glossary - PlanningPoker.live');
    this.metaService.updateTag({
      name: 'description',
      content: 'Comprehensive glossary of Planning Poker and Agile estimation terms. Learn definitions for story points, velocity, Fibonacci sequence, affinity estimation, and more planning poker terminology.',
    });
    this.metaService.addTags([
      {
        name: 'keywords',
        content: 'planning poker definition, story point definition, agile estimation terms, scrum estimation glossary, planning poker glossary, what is a story point, planning poker observer, affinity estimation definition, Fibonacci sequence planning poker, coffee card meaning',
      },
      {
        property: 'og:url',
        content: 'https://planningpoker.live/glossary',
      },
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'PlanningPoker.live' },
      { property: 'og:title', content: 'Planning Poker & Agile Estimation Glossary' },
      {
        property: 'og:description',
        content: 'Comprehensive glossary of Planning Poker and Agile estimation terms. Learn definitions for story points, velocity, Fibonacci sequence, and more.',
      },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@PlanningPokerL' },
      { name: 'twitter:title', content: 'Planning Poker & Agile Estimation Glossary' },
      {
        name: 'twitter:description',
        content: 'Comprehensive glossary of Planning Poker and Agile estimation terms.',
      },
    ]);

    // Create FAQPage schema
    const faqSchema: WithContext<FAQPage> = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: this.terms.map(term => ({
        '@type': 'Question',
        name: `What is ${term.term}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: term.definition,
        },
      })),
    };

    this.schemaTagService.setJsonLd(this.renderer, faqSchema);
  }

  getTermId(term: string): string {
    return term.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }

  linkifyTerm(text: string): string {
    // Find terms in the text and create internal links
    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = [...this.terms].sort((a, b) => b.term.length - a.term.length);
    let linkedText = text;
    
    sortedTerms.forEach(glossaryTerm => {
      // Process matches from end to start to avoid index shifting
      const matches: Array<{index: number, match: string}> = [];
      // Create regex instance for each search
      const termRegex = new RegExp(`\\b${this.escapeRegex(glossaryTerm.term)}\\b`, 'gi');
      let lastIndex = 0;
      let match;
      while ((match = termRegex.exec(linkedText)) !== null) {
        matches.push({ index: match.index, match: match[0] });
        // Prevent infinite loops on zero-length matches
        if (match.index === lastIndex) {
          termRegex.lastIndex++;
        }
        lastIndex = match.index;
      }
      
      // Replace from end to start to preserve indices
      for (let i = matches.length - 1; i >= 0; i--) {
        const { index, match: matchText } = matches[i];
        // Check if we're inside a link tag by examining what comes before
        const beforeMatch = linkedText.substring(0, index);
        const lastOpenTag = beforeMatch.lastIndexOf('<a');
        const lastCloseTag = beforeMatch.lastIndexOf('</a>');
        
        // Check if match is already inside an anchor tag
        if (lastOpenTag !== -1 && (lastCloseTag === -1 || lastCloseTag < lastOpenTag)) {
          // We're inside an anchor tag, skip this match
          continue;
        }
        
        // Also check that we're not at the start of a tag
        if (linkedText.charAt(index - 1) === '>') {
          continue;
        }
        
        // Safe to link - use data attribute for term name and include /glossary in href
        const termId = this.getTermId(matchText);
        const replacement = `<a href="/glossary#${termId}" class="internal-link" data-glossary-term="${matchText}">${matchText}</a>`;
        linkedText = linkedText.substring(0, index) + replacement + linkedText.substring(index + matchText.length);
      }
    });
    
    return linkedText;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

