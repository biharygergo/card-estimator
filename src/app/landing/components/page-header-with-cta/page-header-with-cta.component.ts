import { Component, Input, OnDestroy, PLATFORM_ID, inject, afterNextRender, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import {
  PlatformChromeConfig,
  PlatformMeetingChromeComponent,
} from '../platform-meeting-chrome/platform-meeting-chrome.component';

export interface HeaderConfig {
  /**
   * Optional short kicker rendered above the display headline. When set it
   * becomes the page's h1 and the headline drops to h2, so the primary
   * heading can match the search result title while the headline stays the
   * dominant visual element. Pages that omit it keep the headline as h1.
   */
  eyebrow?: string;
  title: string;
  titleHighlights?: string[];
  description: string;
  internalLink?: string;
  externalLink?: string;
  ctaIcon: string;
  ctaTitle: string;
  showPlatforms: boolean;
  platformChrome?: PlatformChromeConfig;
}

// Animation state for the plain (non-chrome) card/ticket hero, used on the homepage
interface AnimationState {
  showTicket: boolean;
  showEstimator1: boolean;
  showEstimator2: boolean;
  showEstimator3: boolean;
  showVote1: boolean;
  showVote2: boolean;
  showVote3: boolean;
  cardsFlipped: boolean;
  showResults: boolean;
  hideOverlay: boolean;
}

// Animation timeline configuration
interface AnimationStep {
  delay: number;
  updates: Partial<AnimationState>;
}

// Title segment with highlight info
interface TitleSegment {
  text: string;
  highlighted: boolean;
}

@Component({
  selector: 'planning-poker-page-header-with-cta',
  templateUrl: './page-header-with-cta.component.html',
  styleUrl: './page-header-with-cta.component.scss',
  imports: [
    MatIcon,
    MatAnchor,
    RouterLink,
    PlatformMeetingChromeComponent,
    NgTemplateOutlet,
  ],
})
export class PageHeaderWithCtaComponent implements OnDestroy {
  @Input({ required: true }) config!: HeaderConfig;

  // Computed title segments for highlighting
  get titleSegments(): TitleSegment[] {
    if (!this.config.titleHighlights?.length) {
      return [{ text: this.config.title, highlighted: false }];
    }
    
    const segments: TitleSegment[] = [];
    let remaining = this.config.title;
    
    for (const highlight of this.config.titleHighlights) {
      const index = remaining.indexOf(highlight);
      if (index === -1) continue;
      
      if (index > 0) {
        segments.push({ text: remaining.substring(0, index), highlighted: false });
      }
      segments.push({ text: highlight, highlighted: true });
      remaining = remaining.substring(index + highlight.length);
    }
    
    if (remaining) {
      segments.push({ text: remaining, highlighted: false });
    }
    
    return segments;
  }
  
  private platformId = inject(PLATFORM_ID);

  private static readonly INITIAL_STATE: AnimationState = {
    showTicket: false,
    showEstimator1: false,
    showEstimator2: false,
    showEstimator3: false,
    showVote1: false,
    showVote2: false,
    showVote3: false,
    cardsFlipped: false,
    showResults: false,
    hideOverlay: false,
  };

  // Single state signal
  isBrowser = signal(false);
  private animationState = signal<AnimationState>(
    PageHeaderWithCtaComponent.INITIAL_STATE
  );

  // Computed signals for template access
  state = this.animationState.asReadonly();

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  // Animation timeline in milliseconds - overlay appears almost immediately
  // to grab attention fast, rest of the sequence plays out a bit quicker too
  private readonly ANIMATION_TIMELINE: AnimationStep[] = [
    { delay: 150, updates: { showTicket: true } },
    { delay: 900, updates: { showEstimator1: true } },
    { delay: 1300, updates: { showEstimator2: true } },
    { delay: 1700, updates: { showEstimator3: true } },
    { delay: 2800, updates: { showVote1: true } },
    { delay: 3150, updates: { showVote2: true } },
    { delay: 3500, updates: { showVote3: true } },
    { delay: 4800, updates: { cardsFlipped: true } },
    { delay: 5600, updates: { showResults: true } },
  ];

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.isBrowser.set(true);
        // The platform-chrome pages delegate their entire hero animation to
        // <planning-poker-platform-meeting-chrome>, so this card/ticket
        // timeline only needs to run for the plain (homepage) hero.
        if (!this.config.platformChrome) {
          this.startAnimation();
        }
      }
    });
  }

  ngOnDestroy() {
    this.clearAllTimeouts();
  }

  private startAnimation() {
    // Schedule all animation steps - runs once, no looping for a cleaner experience
    this.ANIMATION_TIMELINE.forEach(step => {
      const timeout = setTimeout(() => {
        this.animationState.update(state => ({ ...state, ...step.updates }));
      }, step.delay);
      this.timeouts.push(timeout);
    });
  }

  private clearAllTimeouts() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];
  }
}
