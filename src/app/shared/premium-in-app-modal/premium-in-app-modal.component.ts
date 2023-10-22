import { Component } from '@angular/core';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { PaymentService } from 'src/app/services/payment.service';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { environment } from 'src/environments/environment';

export const premiumInAppModalCreator =
  (): ModalCreator<PremiumInAppModalComponent> => [
    PremiumInAppModalComponent,
    {
      id: 'premiumInAppModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '98vh',
      panelClass: ['custom-dialog', 'rounded-dialog'],
    },
  ];
@Component({
  selector: 'app-premium-in-app-modal',
  templateUrl: './premium-in-app-modal.component.html',
  styleUrls: ['./premium-in-app-modal.component.scss'],
})
export class PremiumInAppModalComponent {
  isRedirecting = false;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analytics: AnalyticsService
  ) {}

  async onUpgradeClick() {
    this.analytics.logClickedPremiumDeal();
    this.isRedirecting = true;
    try {
      await this.paymentService.startSubscriptionToPremium(
        environment.powerUserPromoCode
      );
    } catch (e) {
      console.error(e);
    }

    this.isRedirecting = false;
  }
}
