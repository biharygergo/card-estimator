import { Component, Input, inject } from '@angular/core';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { PaymentService } from 'src/app/services/payment.service';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { LinkService } from 'src/app/services/link.service';
import { ActivatedRoute } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatDialogClose } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

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
  imports: [
    MatButton,
    MatDialogClose,
    MatIcon,
    MatCard,
    MatCardContent,
    MatTooltip,
    AsyncPipe,
  ],
})
export class PremiumLearnMoreComponent {
  @Input() pageMode: 'modal' | 'page' = 'modal';
  promotionCodeFromParams: string | undefined =
    inject(ActivatedRoute).snapshot.queryParamMap.get('promotionCode');

  isLoadingStripe = false;
  isPremium$ = this.paymentService.isPremiumSubscriber();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService
  ) {}

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.startSubscriptionToPremium(
      'eur',
      this.promotionCodeFromParams
    );
  }

  getQuote() {
    const apiUrl =
      window.origin +
      `/api/sendEmail?subject=${encodeURIComponent(
        'Custom quote for Premium subscription'
      )}`;
    this.linkService.openUrl(apiUrl);
  }
}
