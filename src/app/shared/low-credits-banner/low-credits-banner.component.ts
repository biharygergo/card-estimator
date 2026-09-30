import { Component, computed, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { upsellModalCreator } from '../upsell-modal/upsell-modal.component';

@Component({
  selector: 'low-credits-banner',
  templateUrl: './low-credits-banner.component.html',
  styleUrls: ['./low-credits-banner.component.scss'],
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
})
export class LowCreditsBannerComponent {
  readonly creditsRemaining = input<number>(0);

  readonly isHidden = signal<boolean>(false);

  readonly messageTitle = computed(() =>
    this.creditsRemaining() === 1
      ? 'Last credit remaining'
      : "You've run out of credits"
  );

  readonly messageBody = computed(() =>
    this.creditsRemaining() === 1
      ? 'Each credit creates one room. Top up before your next planning so your team is not interrupted.'
      : 'Each credit creates one room. Your team can keep voting here, but new rooms need credits.'
  );

  constructor(private readonly dialog: MatDialog) {}

  hideBanner(): void {
    this.isHidden.set(true);
  }

  openUpsell(): void {
    // One surface owns the offer now, so the banner only has to raise it.
    this.dialog.open(
      ...upsellModalCreator({
        trigger: this.creditsRemaining() > 0 ? 'preempt' : 'intercept',
        creditsRemaining: this.creditsRemaining(),
      })
    );
  }
}
