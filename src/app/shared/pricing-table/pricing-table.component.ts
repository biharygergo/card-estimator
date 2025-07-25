import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Inject,
  Input,
  OnInit,
  Optional,
  signal,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { LinkService } from 'src/app/services/link.service';
import { PaymentService } from 'src/app/services/payment.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { BundleName, FaqItem } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
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
import { combineLatest, defer, map, startWith, take } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { OrganizationSelectorComponent } from '../organization-selector/organization-selector.component';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { ActivatedRoute } from '@angular/router';

interface PricingDialogData {
  selectedTab?: 'credits' | 'premium' | 'org-credits';
}

export const pricingModalCreator = (
  config: PricingDialogData = {}
): ModalCreator<PricingTableComponent> => [
  PricingTableComponent,
  {
    id: 'pricingModal',
    maxWidth: '100vw',
    maxHeight: '100vh',
    width: '100%',
    panelClass: 'full-screen-modal',
    data: config,
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
      'when you start and 1 free credit after registration every month. Starter credits expire after two months & contains ads.',
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

const FAQS: FaqItem[] = [
  {
    question: 'How do credits work in PlanningPoker.live?',
    answer:
      'Credits are our simple pay-as-you-go system. One credit allows you to create one planning poker room where your entire team can estimate stories together. Think of it like creating a meeting room - the creator needs a credit, but all participants can join for free!',
  },
  {
    question: 'Do I need credits to join a planning poker session?',
    answer:
      'No! Only creating a new room requires a credit. Joining existing rooms is completely free for all team members. This means your entire team can participate in planning sessions without needing their own credits.',
  },
  {
    question: 'Why use credits instead of a monthly subscription?',
    answer:
      'Credits offer more flexibility and cost-effectiveness than monthly subscriptions. You only pay for the planning sessions you actually conduct, making it perfect for teams with varying sprint schedules. Whether you plan weekly, bi-weekly, or monthly, you can purchase credits as needed without being locked into a recurring payment.',
  },
  {
    question: 'How long do credits last?',
    answer:
      'Paid credits never expire - use them whenever you need them! Only the welcome bundle credits (5 free credits upon registration + 1 monthly) expire after two months to ensure fair usage of the free tier.',
  },
  {
    question: "What's included in the welcome bundle?",
    answer:
      'The welcome bundle gives you 5 free credits to start with, plus 1 free credit every month. These starter credits let you try out the full functionality of PlanningPoker.live. Note that welcome bundle credits expire after two months and sessions include ads. For ad-free experience and never-expiring credits, check out our paid bundles!',
  },
  {
    question: 'What are organization credits?',
    answer:
      'Organization credits are perfect for larger teams or companies. They can be shared across all members of your organization, making it easy to manage planning poker sessions across multiple teams. Organization admins can purchase and distribute credits as needed.',
  },
];
@Component({
  selector: 'app-pricing-table',
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

  readonly FAQS = FAQS;
  readonly PLANS = PLANS;
  isLoadingStripe = false;
  isLoadingStripeForBundle: string;
  isPremium$ = this.paymentService.isPremiumSubscriber();
  organizations$ = this.organizationService.getMyOrganizations();
  currencyControl = new FormControl<'eur' | 'usd'>('usd', {
    nonNullable: true,
  });
  creditTypeSelector = new FormControl<'personal' | 'organization'>(
    'personal',
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

  currencyShortSymbol = defer(() =>
    this.currencyControl.valueChanges.pipe(
      startWith(this.currencyControl.value),
      map(currency => (currency === 'usd' ? '$' : '€'))
    )
  );

  private calculateMultiplier(count: number): number {
    if (count === 25) {
      return 1.5;
    }
    if (count === 75) {
      return 1.2;
    }
    if (count === 150) {
      return 1;
    }
    if (count === 300) {
      return 0.8;
    }

    return 1;
  }

  orgCreditAmountLabel$ = combineLatest([
    this.currencyShortSymbol,
    this.purchaseForm.controls.creditCount.valueChanges.pipe(startWith(150)),
  ]).pipe(map(([currency, count]) => `${this.calculateMultiplier(count)}${currency} x ${count} credits`));

  orgCreditTotalLabel$ = combineLatest([
    this.currencyShortSymbol,
    this.purchaseForm.controls.creditCount.valueChanges.pipe(startWith(150)),
  ]).pipe(map(([currency, count]) => {
    const total = this.calculateMultiplier(count) * count;
    return `${total}${currency}`;
  }));

  selectedTabIndex = signal<number>(0);

  BundleName = BundleName;
  theme = toSignal(inject(ThemeService).themeValue);
  readonly Theme = Theme;
  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly linkService: LinkService,
    private readonly destroyRef: DestroyRef,
    private readonly changeDetectorRef: ChangeDetectorRef,
    @Inject(APP_CONFIG) public config: AppConfig,
    @Optional()
    @Inject(MAT_DIALOG_DATA)
    private readonly dialogData: PricingDialogData,
    private readonly organizationService: OrganizationService,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    // Handle query parameters for page mode
    if (this.pageMode === 'page') {
      this.activatedRoute.queryParams
        .pipe(take(1), takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          const tabParam = params['tab'] as string;
          if (tabParam) {
            this.selectTabFromParam(tabParam);
          }
        });
    }

    // Handle dialog data for modal mode
    if (this.dialogData?.selectedTab) {
      this.selectTabFromParam(this.dialogData.selectedTab);
    }

    // Check if user has organizations and default to organization credits if they do
    // Only if no specific tab was selected via query param or dialog data
    this.organizations$
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe(organizations => {
        const hasExplicitTabSelection = this.dialogData?.selectedTab || 
          (this.pageMode === 'page' && this.activatedRoute.snapshot.queryParams['tab']);
        
        if (organizations.length > 0 && !hasExplicitTabSelection) {
          this.creditTypeSelector.setValue('organization');
        }
      });

    this.creditTypeSelector.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(creditType => {
        if (creditType === 'organization') {
          this.selectedTabIndex.set(0);
          this.changeDetectorRef.markForCheck();
        }
      });
  }

  private selectTabFromParam(tab: string) {
    switch (tab) {
      case 'credits':
        this.selectedTabIndex.set(0);
        break;
      case 'premium':
        this.selectedTabIndex.set(1);
        break;
      case 'org-credits':
        this.creditTypeSelector.setValue('organization');
        break;
    }
  }

  async buyBundle(bundleName: BundleName) {
    this.isLoadingStripeForBundle = bundleName;
    this.analyticsService.logClickedBuyBundle('pricing_table');
    await this.paymentService.buyBundle(bundleName, this.currencyControl.value);
  }

  async buyOrganizationBundle() {
    const formValue = this.purchaseForm.value;
    if (!formValue.organizationId || !formValue.creditCount) {
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
