import { Component, Input } from '@angular/core';
import { PaymentService } from 'src/app/services/payment.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const premiumLearnMoreModalCreator =
  (): ModalCreator<PremiumLearnMoreComponent> => [
    PremiumLearnMoreComponent,
    {
      id: 'premiumLearnMoreModal',
      maxWidth: '100vw',
      maxHeight: '100vh',
      height: '100%',
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

  constructor(private readonly paymentService: PaymentService) {}

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    await this.paymentService.startSubscriptionToPremium();
  }
}
