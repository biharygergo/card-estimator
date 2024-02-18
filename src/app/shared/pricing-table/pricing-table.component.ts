import { Component, Inject, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { LinkService } from 'src/app/services/link.service';
import { PaymentService } from 'src/app/services/payment.service';
import { BundleName } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

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
  cloudinaryId: string;
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
    imageUrl: '/assets/bundle_5.png',
    cloudinaryId: 'bundle_5',
    title: 'Welcome bundle',
    description:
      'when you register and 1 free credit every month afterwards. Credits expire after two months & contains ads.',
    creditAmount: 5,
    priceEuro: 0,
    priceDescription: 'assigned automatically',
    isSelectDisabled: true,
  },
  {
    id: 'small-bundle',
    bundleName: BundleName.SMALL_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '/assets/bundle_7.png',
    cloudinaryId: 'bundle_7',
    title: 'Small bundle',
    description:
      'ideal for the SCRUM master of a team that plans biweekly. Credits do not expire & no ads.',
    creditAmount: 7,
    priceEuro: 9,
    priceDescription: 'one-time purchase',
    isSelectDisabled: false,
  },
  {
    id: 'large-bundle',
    bundleName: BundleName.LARGE_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '/assets/bundle_15.png',
    cloudinaryId: 'bundle_15',
    title: 'Large bundle',
    description:
      'ideal for the SCRUM master of a team with weekly planning. Credits do not expire & no ads.',
    creditAmount: 15,
    priceEuro: 17,
    priceDescription: 'one-time purchase',
    isSelectDisabled: false,
  },
  {
    id: 'mega-bundle',
    bundleName: BundleName.MEGA_BUNDLE,
    stripeProductId: 'example-id', // TODO
    imageUrl: '/assets/bundle_50.png',
    cloudinaryId: 'bundle_50',
    title: 'Mega bundle',
    description:
      'great for the SCRUM master of multiple teams with many planning meetings per week. Credits do not expire & no ads.',
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
    MatButtonToggleModule,
    NgOptimizedImage,
    ReactiveFormsModule,
  ],
  templateUrl: './pricing-table.component.html',
  styleUrl: './pricing-table.component.scss',
})
export class PricingTableComponent {
  @Input({ required: true }) pageMode: 'modal' | 'page' = 'modal';

  readonly PLANS = PLANS;
  isLoadingStripe = false;
  isLoadingStripeForBundle: string;
  isPremium$ = this.paymentService.isPremiumSubscriber();
  currencyControl = new FormControl<'eur'|'usd'>('usd', {nonNullable: true});
  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService,
    @Inject(APP_CONFIG) public config: AppConfig,
  ) {}

  async buyBundle(bundleName: BundleName) {
    this.isLoadingStripeForBundle = bundleName;
    // this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.buyBundle(bundleName, this.currencyControl.value);
  }

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analyticsService.logClickedSubscribeToPremium('premium_learn_more');
    await this.paymentService.startSubscriptionToPremium(this.currencyControl.value);
  }
}
