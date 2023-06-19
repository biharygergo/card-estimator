import { Component, Input } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { PaymentService } from 'src/app/services/payment.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { LinkService } from 'src/app/services/link.service';

export const premiumLearnMoreModalCreator =
  (): ModalCreator<PremiumLearnMoreComponent> => [
    PremiumLearnMoreComponent,
    {
      id: 'premiumLearnMoreModal',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100%',
      panelClass: 'full-screen-modal',
    },
  ];

@Component({
  selector: 'app-premium-learn-more',
  templateUrl: './premium-learn-more.component.html',
  styleUrls: ['./premium-learn-more.component.scss'],
})
export class PremiumLearnMoreComponent {
  @Input() pageMode: 'modal' | 'page' = 'modal';

  isLoadingStripe = false;
  isPremium$ = this.paymentService.isPremiumSubscriber();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService,
  ) {}

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.startSubscriptionToPremium();
  }

  getQuote() {
    const apiUrl = window.origin + `/api/sendEmail?subject=${encodeURIComponent('Custom quote for Premium subscription')}`;
    this.linkService.openUrl(apiUrl);
  }
}
