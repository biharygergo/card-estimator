import { Component, Input, OnDestroy, PLATFORM_ID, inject, afterNextRender, signal } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { isPlatformBrowser } from '@angular/common';

export interface PlatformChromeConfig {
  name: 'zoom' | 'teams' | 'meet';
  label: string;
  logo: string;
  accentColor: string;
}

// Animation state for the stepped meeting-chrome intro
interface ChromeAnimationState {
  showSplash: boolean;
  showMeetingJoined: boolean;
  showSidebar: boolean;
  showEstimator1: boolean;
  showEstimator2: boolean;
  showEstimator3: boolean;
  showVote1: boolean;
  showVote2: boolean;
  showVote3: boolean;
  cardsFlipped: boolean;
  showResults: boolean;
}

interface AnimationStep {
  delay: number;
  updates: Partial<ChromeAnimationState>;
}

/**
 * Fake "embedded in a meeting" intro shown on platform integration pages
 * (Zoom/Teams/Meet): an app "loading" splash, then video tiles join the call,
 * then the sidebar slides in and plays a compact, sidebar-native version of
 * the join/vote/reveal/stats flow.
 */
@Component({
  selector: 'planning-poker-platform-meeting-chrome',
  templateUrl: './platform-meeting-chrome.component.html',
  styleUrl: './platform-meeting-chrome.component.scss',
  imports: [MatIcon],
})
export class PlatformMeetingChromeComponent implements OnDestroy {
  @Input({ required: true }) config!: PlatformChromeConfig;

  // Decorative video-call tiles, using the same Dicebear avatar service as
  // the in-app avatar picker (avatar-selector-modal.component.ts)
  readonly videoTileAvatars = ['Derek', 'Eve', 'Frank', 'Grace'].map(
    seed => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&style=circle`
  );

  private platformId = inject(PLATFORM_ID);

  private static readonly INITIAL_STATE: ChromeAnimationState = {
    // Starts true so this renders the splash frame as its static
    // (SSR/pre-animation) state, matching the first moment of the animation.
    showSplash: true,
    showMeetingJoined: false,
    showSidebar: false,
    showEstimator1: false,
    showEstimator2: false,
    showEstimator3: false,
    showVote1: false,
    showVote2: false,
    showVote3: false,
    cardsFlipped: false,
    showResults: false,
  };

  private animationState = signal<ChromeAnimationState>(
    PlatformMeetingChromeComponent.INITIAL_STATE
  );
  state = this.animationState.asReadonly();

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  private readonly CHROME_TIMELINE: AnimationStep[] = [
    { delay: 1000, updates: { showSplash: false, showMeetingJoined: true } },
    { delay: 1800, updates: { showSidebar: true } },
    { delay: 2200, updates: { showEstimator1: true } },
    { delay: 2600, updates: { showEstimator2: true } },
    { delay: 3000, updates: { showEstimator3: true } },
    { delay: 4100, updates: { showVote1: true } },
    { delay: 4450, updates: { showVote2: true } },
    { delay: 4800, updates: { showVote3: true } },
    { delay: 6100, updates: { cardsFlipped: true } },
    { delay: 6900, updates: { showResults: true } },
  ];

  constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.startAnimation();
      }
    });
  }

  ngOnDestroy() {
    this.clearAllTimeouts();
  }

  restartAnimation() {
    this.clearAllTimeouts();
    this.animationState.set(PlatformMeetingChromeComponent.INITIAL_STATE);
    this.startAnimation();
  }

  private startAnimation() {
    // Schedule all animation steps - runs once, no looping for a cleaner experience
    this.CHROME_TIMELINE.forEach(step => {
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
