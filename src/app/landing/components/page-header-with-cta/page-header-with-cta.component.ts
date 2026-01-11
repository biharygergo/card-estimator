import { Component, Input, OnDestroy, PLATFORM_ID, inject, afterNextRender, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface HeaderConfig {
  title: string;
  titleHighlights?: string[];
  description: string;
  internalLink?: string;
  externalLink?: string;
  ctaIcon: string;
  ctaTitle: string;
  showPlatforms: boolean;
}

// Animation state
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
  imports: [MatIcon, MatAnchor, RouterLink, CommonModule],
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
  
  // Single state signal
  isBrowser = signal(false);
  private animationState = signal<AnimationState>({
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
  });
  
  // Computed signals for template access
  state = this.animationState.asReadonly();
  
  private timeouts: ReturnType<typeof setTimeout>[] = [];
  
  // Animation timeline in milliseconds - slower, more elegant timing
  private readonly ANIMATION_TIMELINE: AnimationStep[] = [
    { delay: 1200, updates: { showTicket: true } },
    { delay: 2600, updates: { showEstimator1: true } },
    { delay: 3200, updates: { showEstimator2: true } },
    { delay: 3800, updates: { showEstimator3: true } },
    { delay: 5200, updates: { showVote1: true } },
    { delay: 5700, updates: { showVote2: true } },
    { delay: 6200, updates: { showVote3: true } },
    { delay: 8000, updates: { cardsFlipped: true } },
    { delay: 9200, updates: { showResults: true } },
  ];
  
  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.isBrowser.set(true);
        this.startAnimation();
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
