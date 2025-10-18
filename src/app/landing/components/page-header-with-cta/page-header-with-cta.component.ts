import { Component, Input, OnDestroy, PLATFORM_ID, inject, afterNextRender, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatAnchor } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CommonModule, isPlatformBrowser } from '@angular/common';

export interface HeaderConfig {
  title: string;
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

@Component({
  selector: 'planning-poker-page-header-with-cta',
  templateUrl: './page-header-with-cta.component.html',
  styleUrl: './page-header-with-cta.component.scss',
  imports: [MatIcon, MatAnchor, RouterLink, CommonModule],
})
export class PageHeaderWithCtaComponent implements OnDestroy {
  @Input({ required: true }) config!: HeaderConfig;
  
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
  
  // Animation timeline in milliseconds
  private readonly ANIMATION_TIMELINE: AnimationStep[] = [
    { delay: 800, updates: { showTicket: true } },
    { delay: 1800, updates: { showEstimator1: true } },
    { delay: 2200, updates: { showEstimator2: true } },
    { delay: 2600, updates: { showEstimator3: true } },
    { delay: 3800, updates: { showVote1: true } },
    { delay: 4100, updates: { showVote2: true } },
    { delay: 4400, updates: { showVote3: true } },
    { delay: 5700, updates: { cardsFlipped: true } },
    { delay: 6500, updates: { showResults: true } },
    { delay: 9000, updates: { hideOverlay: true } },
  ];
  
  private readonly LOOP_DURATION = 9500;
  
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
    // Schedule all animation steps
    this.ANIMATION_TIMELINE.forEach(step => {
      const timeout = setTimeout(() => {
        this.animationState.update(state => ({ ...state, ...step.updates }));
      }, step.delay);
      this.timeouts.push(timeout);
    });
    
    // Schedule reset and loop
    const loopTimeout = setTimeout(() => {
      this.resetAnimation();
      this.startAnimation();
    }, this.LOOP_DURATION);
    this.timeouts.push(loopTimeout);
  }
  
  private resetAnimation() {
    this.animationState.set({
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
    this.timeouts = [];
  }
  
  private clearAllTimeouts() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts = [];
  }
}
