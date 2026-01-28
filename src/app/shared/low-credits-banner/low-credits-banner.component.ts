import { Component, Input, OnInit, signal, OnDestroy } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { PaymentService } from 'src/app/services/payment.service';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { BundleName, Organization } from 'src/app/types';
import { pricingModalCreator } from '../pricing-table/pricing-table.component';

interface BundleOption {
  id: string;
  bundleName: BundleName;
  creditAmount: number;
  priceUsd: number;
  label: string;
}

interface OrgBundleOption {
  id: string;
  creditAmount: number;
  priceUsd: number;
}

const INDIVIDUAL_BUNDLES: BundleOption[] = [
  {
    id: 'small',
    bundleName: BundleName.SMALL_BUNDLE,
    creditAmount: 7,
    priceUsd: 9,
    label: '7 - $9',
  },
  {
    id: 'large',
    bundleName: BundleName.LARGE_BUNDLE,
    creditAmount: 15,
    priceUsd: 17,
    label: '15 - $17',
  },
  {
    id: 'mega',
    bundleName: BundleName.MEGA_BUNDLE,
    creditAmount: 50,
    priceUsd: 50,
    label: '50 - $50',
  },
];

const ORG_BUNDLES: OrgBundleOption[] = [
  { id: 'org-25', creditAmount: 25, priceUsd: 38 },
  { id: 'org-75', creditAmount: 75, priceUsd: 90 },
  { id: 'org-150', creditAmount: 150, priceUsd: 150 },
  { id: 'org-300', creditAmount: 300, priceUsd: 240 },
];

@Component({
  selector: 'low-credits-banner',
  templateUrl: './low-credits-banner.component.html',
  styleUrls: ['./low-credits-banner.component.scss'],
  imports: [
    CommonModule,
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
})
export class LowCreditsBannerComponent implements OnInit, OnDestroy {
  @Input() creditsRemaining: number = 0;

  isHidden = signal<boolean>(false);
  loadingBundleId = signal<string | null>(null);
  destroy = new Subject<void>();
  
  organizations$ = this.organizationService.getMyOrganizations();
  hasOrganization = signal<boolean>(false);
  selectedOrganization = signal<Organization | undefined>(undefined);

  individualBundles = INDIVIDUAL_BUNDLES;
  orgBundles = ORG_BUNDLES;

  constructor(
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly organizationService: OrganizationService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Subscribe to organizations
    this.organizations$
      .pipe(takeUntil(this.destroy))
      .subscribe(orgs => {
        this.hasOrganization.set(orgs && orgs.length > 0);
        this.selectedOrganization.set(orgs?.[0]);
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  get messageTitle(): string {
    if (this.creditsRemaining === 1) {
      return 'Last credit remaining';
    }
    return "You've run out of credits";
  }

  get messageBody(): string {
    if (this.creditsRemaining === 1) {
      return "You're down to your last credit. Each credit lets you create a new PlanningPoker.live room. Top up now to keep your team estimating without interruption.";
    }
    return "You've run out of credits. Each credit creates a new PlanningPoker.live room with unlimited participants and features. Get more to continue hosting sessions.";
  }

  hideBanner(): void {
    this.isHidden.set(true);
  }

  openPricingModal(): void {
    this.dialog.open(...pricingModalCreator({}));
  }

  async buySpecificBundle(bundleId: string): Promise<void> {
    this.loadingBundleId.set(bundleId);
    this.analyticsService.logClickedBuyBundle('low_credits_banner');

    try {
      if (this.hasOrganization()) {
        // Organization bundle purchase
        const orgBundle = ORG_BUNDLES.find(b => b.id === bundleId);
        const org = this.selectedOrganization();
        
        if (orgBundle && org) {
          await this.paymentService.buyBundle(
            BundleName.ORGANIZATION_BUNDLE,
            'usd',
            org.id,
            orgBundle.creditAmount
          );
        }
      } else {
        // Individual bundle purchase
        const bundle = INDIVIDUAL_BUNDLES.find(b => b.id === bundleId);
        
        if (bundle) {
          await this.paymentService.buyBundle(
            bundle.bundleName,
            'usd'
          );
        }
      }
    } catch (error) {
      console.error('Error purchasing bundle:', error);
      this.loadingBundleId.set(null);
    }
  }
}
