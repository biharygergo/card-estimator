import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { LinkService } from 'src/app/services/link.service';
import { PaymentService } from 'src/app/services/payment.service';
import { BundleName } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

export const pricingModalCreator = (): ModalCreator<PricingTableComponent> => [
  PricingTableComponent,
  {
    id: 'pricingModal',
    maxWidth: '100vw',
    maxHeight: '100vh',
    width: '100%',
    panelClass: 'full-screen-modal',
  },
];

interface PurchaseOption {
  id: string;
  bundleName: BundleName | undefined;
  stripeProductId: string;
  imageUrl: string;
  title: string;
  description: string;
  creditAmount: number;
  priceEuro: number;
  priceDescription: string;
  isSelectDisabled: boolean;
}

const PLANS: PurchaseOption[] = [
  {
    id: 'welcome-bundle',
    bundleName: undefined,
    stripeProductId: 'example-id', // TODO
    imageUrl: '',
    title: 'Welcome bundle',
    description: 'for every new user, expires after 2 months',
    creditAmount: 5,
    priceEuro: 0,
    priceDescription: 'assigned automatically',
    isSelectDisabled: true,
  },
  {
    id: 'small-bundle',
    bundleName: BundleName.SMALL_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '',
    title: 'Small bundle',
    description: 'for SCRUM masters of a single team with bi-weekly planning',
    creditAmount: 5,
    priceEuro: 8,
    priceDescription: 'one-time purchase',
    isSelectDisabled: false,
  },
  {
    id: 'large-bundle',
    bundleName: BundleName.LARGE_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '',
    title: 'Large bundle',
    description: 'for SCRUM masters of a single team with weekly planning',
    creditAmount: 10,
    priceEuro: 14,
    priceDescription: 'one-time purchase',
    isSelectDisabled: false,
  },
  {
    id: 'mega-bundle',
    bundleName: BundleName.MEGA_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '',
    title: 'Mega bundle',
    description: 'for SCRUM masters of multiple teams with weekly planning',
    creditAmount: 50,
    priceEuro: 50,
    priceDescription: 'one-time purchase',
    isSelectDisabled: false,
  },
];
@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './pricing-table.component.html',
  styleUrl: './pricing-table.component.scss',
})
export class PricingTableComponent {
  @Input({ required: true }) pageMode: 'modal' | 'page' = 'modal';

  readonly PLANS = PLANS;
  isLoadingStripe = false;
  isPremium$ = this.paymentService.isPremiumSubscriber();

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService
  ) {}

  async buyBundle(bundleName: BundleName) {
    this.isLoadingStripe = true;
    // this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.buyBundle(bundleName);
  }

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.startSubscriptionToPremium();
  }
}
