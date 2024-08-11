import { ChangeDetectorRef, Component, DestroyRef, Inject, Input, OnInit, signal } from '@angular/core';
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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import {
  combineLatest,
  map,
  shareReplay,
  startWith,
  take,
  takeUntil,
} from 'rxjs';
import { OrganizationService } from 'src/app/services/organization.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationSelectorComponent } from '../organization-selector/organization-selector.component';

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
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    NgOptimizedImage,
    ReactiveFormsModule,
    OrganizationSelectorComponent,
  ],
  templateUrl: './pricing-table.component.html',
  styleUrl: './pricing-table.component.scss',
})
export class PricingTableComponent implements OnInit {
  @Input({ required: true }) pageMode: 'modal' | 'page' = 'modal';

  readonly PLANS = PLANS;
  isLoadingStripe = false;
  isLoadingStripeForBundle: string;
  isPremium$ = this.paymentService.isPremiumSubscriber();
  currencyControl = new FormControl<'eur' | 'usd'>('usd', {
    nonNullable: true,
  });
  creditTypeSelector = new FormControl<'personal' | 'organization'>(
    'organization',
    { nonNullable: true }
  );

  purchaseForm = new FormGroup({
    organizationId: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    creditCount: new FormControl<number>(150, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  currencyShortSymbol = this.currencyControl.valueChanges.pipe(
    startWith('usd'),
    map((currency) => (currency === 'usd' ? '$' : '€'))
  );

  orgCreditAmountLabel$ = combineLatest([
    this.currencyShortSymbol,
    this.purchaseForm.controls.creditCount.valueChanges.pipe(startWith(150)),
  ]).pipe(map(([currency, count]) => `1${currency} x ${count} credits`));

  orgCreditTotalLabel$ = combineLatest([
    this.currencyShortSymbol,
    this.purchaseForm.controls.creditCount.valueChanges.pipe(startWith(150)),
  ]).pipe(map(([currency, count]) => `${count}${currency}`));


  selectedTabIndex = signal<number>(0);

  BundleName = BundleName;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit() {
    this.creditTypeSelector.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(creditType => {
      if (creditType === 'organization') {
        this.selectedTabIndex.set(0);
        this.changeDetectorRef.markForCheck();
      }
    })
  }

  async buyBundle(bundleName: BundleName) {
    this.isLoadingStripeForBundle = bundleName;
    this.analyticsService.logClickedBuyBundle('pricing_table');
    await this.paymentService.buyBundle(bundleName, this.currencyControl.value);
  }

  async buyOrganizationBundle() {
    const formValue = this.purchaseForm.value;
    if (
      !formValue.organizationId ||
      !formValue.creditCount
    ) {
      return;
    }

    this.isLoadingStripeForBundle = BundleName.ORGANIZATION_BUNDLE;
    this.analyticsService.logClickedBuyBundle('pricing_table');
    await this.paymentService.buyBundle(
      BundleName.ORGANIZATION_BUNDLE,
      this.currencyControl.value,
      formValue.organizationId,
      formValue.creditCount
    );
  }

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analyticsService.logClickedSubscribeToPremium('pricing_table');
    await this.paymentService.startSubscriptionToPremium(
      this.currencyControl.value
    );
  }
}
