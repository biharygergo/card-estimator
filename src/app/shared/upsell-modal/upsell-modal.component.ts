import {
  Component,
  computed,
  DestroyRef,
  inject,
  Inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { combineLatest, map, take } from 'rxjs';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AnalyticsService,
  PaywallTrigger,
} from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { PaymentService } from 'src/app/services/payment.service';
import { Theme, ThemeService } from 'src/app/services/theme.service';
import { BundleName, Room } from 'src/app/types';
import { createModal } from '../avatar-selector-modal/avatar-selector-modal.component';
import { organizationModalCreator } from '../organization-modal/organization-modal.component';

export interface UpsellModalData {
  trigger: PaywallTrigger;
  creditsRemaining?: number;
}

export const upsellModalCreator = (data: UpsellModalData) =>
  createModal(UpsellModalComponent, {
    id: 'upsellModal',
    width: '95%',
    maxWidth: '1000px',
    maxHeight: '92vh',
    panelClass: ['custom-dialog', 'rounded-dialog'],
    data,
  });

/** How often a team plans, and how many weeks one credit therefore covers. */
type Cadence = 'weekly' | 'biweekly' | 'monthly';

const CADENCES: { id: Cadence; label: string; weeksPerCredit: number }[] = [
  { id: 'weekly', label: 'Weekly', weeksPerCredit: 1 },
  { id: 'biweekly', label: 'Every 2 weeks', weeksPerCredit: 2 },
  { id: 'monthly', label: 'Monthly', weeksPerCredit: 4.345 },
];

const WEEKS_PER_MONTH = 4.345;

export interface UpsellPlan {
  id: string;
  scope: 'personal' | 'team';
  bundleName: BundleName;
  label: string;
  credits: number;
  priceUsd: number;
  /** Shown as a badge in the plan list. */
  tag?: string;
}

/** Mirrors PLANS in pricing-table.component.ts. */
const PERSONAL_PLANS: UpsellPlan[] = [
  {
    id: 'small',
    scope: 'personal',
    bundleName: BundleName.SMALL_BUNDLE,
    label: '7 credits',
    credits: 7,
    priceUsd: 9,
  },
  {
    id: 'large',
    scope: 'personal',
    bundleName: BundleName.LARGE_BUNDLE,
    label: '15 credits',
    credits: 15,
    priceUsd: 17,
    tag: 'Popular',
  },
  {
    id: 'mega',
    scope: 'personal',
    bundleName: BundleName.MEGA_BUNDLE,
    label: '50 credits',
    credits: 50,
    priceUsd: 50,
    tag: 'Best rate',
  },
];

/** Mirrors ORG_BUNDLES and calculateMultiplier() in the pricing table. */
const TEAM_PLANS: UpsellPlan[] = [
  {
    id: 'org-25',
    scope: 'team',
    bundleName: BundleName.ORGANIZATION_BUNDLE,
    label: '25 shared',
    credits: 25,
    priceUsd: 38,
  },
  {
    id: 'org-75',
    scope: 'team',
    bundleName: BundleName.ORGANIZATION_BUNDLE,
    label: '75 shared',
    credits: 75,
    priceUsd: 90,
    tag: 'Popular',
  },
  {
    id: 'org-150',
    scope: 'team',
    bundleName: BundleName.ORGANIZATION_BUNDLE,
    label: '150 shared',
    credits: 150,
    priceUsd: 150,
  },
  {
    id: 'org-300',
    scope: 'team',
    bundleName: BundleName.ORGANIZATION_BUNDLE,
    label: '300 shared',
    credits: 300,
    priceUsd: 240,
    tag: 'Best rate',
  },
];

const ALL_PLANS = [...PERSONAL_PLANS, ...TEAM_PLANS];

interface ComparisonRow {
  label: string;
  free: string;
  selected: string;
  /** The row the upsell turns on, emphasised in the table. */
  isHook?: boolean;
}

@Component({
  selector: 'app-upsell-modal',
  templateUrl: './upsell-modal.component.html',
  styleUrl: './upsell-modal.component.scss',
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
})
export class UpsellModalComponent implements OnInit {
  readonly Theme = Theme;
  readonly theme = toSignal(inject(ThemeService).themeValue);

  readonly cadences = CADENCES;
  readonly personalPlans = PERSONAL_PLANS;
  readonly teamPlans = TEAM_PLANS;
  readonly squadOptions = [1, 2, 4, 8];

  readonly selectedPlanId = signal<string>('large');
  readonly cadence = signal<Cadence>('biweekly');
  readonly squads = signal<number>(2);
  readonly isRedirecting = signal<boolean>(false);

  readonly organizations$ = this.organizationService.getMyOrganizations();
  readonly organization = toSignal(
    this.organizations$.pipe(map(orgs => orgs?.[0]))
  );

  /** Rooms the user took part in recently, used for the usage line. */
  private readonly recentRooms = signal<Room[]>([]);
  private readonly userId = signal<string | undefined>(undefined);

  private readonly openedAt = Date.now();
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedPlan = computed(
    () => ALL_PLANS.find(p => p.id === this.selectedPlanId()) ?? PERSONAL_PLANS[1]
  );

  readonly isTeamPlan = computed(() => this.selectedPlan().scope === 'team');

  /** Only the active scope's plans; the scope toggle switches between them. */
  readonly visiblePlans = computed(() =>
    this.isTeamPlan() ? this.teamPlans : this.personalPlans
  );

  readonly pricePerRoom = computed(
    () => this.selectedPlan().priceUsd / this.selectedPlan().credits
  );

  /** Weeks the selected bundle covers at the chosen cadence. */
  readonly runwayWeeks = computed(() => {
    const plan = this.selectedPlan();
    const weeksPerCredit =
      CADENCES.find(c => c.id === this.cadence())?.weeksPerCredit ?? 2;
    const teams = plan.scope === 'team' ? this.squads() : 1;
    return (plan.credits * weeksPerCredit) / teams;
  });

  readonly runwayLabel = computed(() => {
    const weeks = this.runwayWeeks();
    if (weeks < 52) {
      return `${Math.round(weeks)} weeks`;
    }
    const months = weeks / WEEKS_PER_MONTH;
    if (months < 24) {
      return `${Math.round(months)} months`;
    }
    const years = weeks / 52;
    return `${years < 10 ? Math.round(years * 10) / 10 : Math.round(years)} years`;
  });

  readonly runsOutLabel = computed(() =>
    new Date(
      Date.now() + this.runwayWeeks() * 7 * 24 * 60 * 60 * 1000
    ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  readonly headline = computed(() => {
    switch (this.data.trigger) {
      case 'preempt':
        return {
          eyebrow: '1 credit left',
          title: 'Top up before your next planning',
          lede: 'You can still create one more room. After that, new rooms need credits.',
        };
      case 'solo_creator':
        return {
          eyebrow: 'You create every room',
          title: 'Let your teammates create rooms too',
          lede: 'Shared credits sit in one pool your whole team draws from, so planning still happens when you are away.',
        };
      default:
        return {
          eyebrow: 'Out of credits',
          title: 'Get your team back to estimating',
          lede: 'One credit creates one room. Everyone you invite joins free, with no seats and no per-user pricing.',
        };
    }
  });

  /** "9 rooms since March, all created by you", when we have the history. */
  readonly usageLabel = computed(() => {
    const rooms = this.recentRooms();
    if (!rooms?.length) {
      return undefined;
    }

    const userId = this.userId();
    const createdByMe = rooms.filter(
      room => !!userId && room.createdById === userId
    );
    if (!createdByMe.length) {
      return undefined;
    }

    const oldest = this.toDate(createdByMe[createdByMe.length - 1].createdAt);
    const since = oldest
      ? oldest.toLocaleDateString('en-US', { month: 'long' })
      : undefined;

    const allMine = createdByMe.length === rooms.length;
    return `${createdByMe.length} room${createdByMe.length === 1 ? '' : 's'}${
      since ? ` since ${since}` : ''
    }${allMine ? ', all created by you' : ''}`;
  });

  readonly comparisonRows = computed<ComparisonRow[]>(() => {
    const plan = this.selectedPlan();
    const isTeam = plan.scope === 'team';

    return [
      {
        label: isTeam ? 'Rooms your team can create' : 'Rooms you can create',
        free: `${this.data.creditsRemaining ?? 0} left`,
        selected: `${plan.credits} rooms`,
      },
      {
        label: isTeam ? 'Lasts your team' : 'Lasts you',
        free: 'about a month',
        selected: this.runwayLabel(),
      },
      {
        label: 'Cost per room',
        free: '—',
        selected: `$${this.pricePerRoom().toFixed(2)}`,
      },
      { label: 'Credits expire', free: 'in 2 months', selected: 'never' },
      { label: 'Ads in your rooms', free: 'yes', selected: 'none' },
      {
        label: 'Teammates can create rooms',
        free: 'no',
        selected: isTeam ? 'yes' : 'no',
        isHook: true,
      },
    ];
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public readonly data: UpsellModalData,
    public readonly dialogRef: MatDialogRef<UpsellModalComponent>,
    private readonly paymentService: PaymentService,
    private readonly organizationService: OrganizationService,
    private readonly estimatorService: EstimatorService,
    private readonly authService: AuthService,
    private readonly analytics: AnalyticsService,
    private readonly dialog: MatDialog
  ) {
    if (data.trigger === 'solo_creator') {
      this.selectedPlanId.set('org-75');
    }
  }

  ngOnInit(): void {
    this.analytics.logPaywallShown(
      this.data.trigger,
      this.data.creditsRemaining ?? 0
    );

    this.dialogRef
      .beforeClosed()
      .pipe(take(1))
      .subscribe(() => {
        this.analytics.logPaywallDismissed(
          this.data.trigger,
          Math.round((Date.now() - this.openedAt) / 1000)
        );
      });

    // Infer the planning cadence from the gaps between the user's own rooms so
    // the runway starts from something true instead of a guess.
    combineLatest([
      this.authService.user,
      this.estimatorService.getPreviousSessions(30),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([user, rooms]) => {
        this.userId.set(user?.uid);
        this.recentRooms.set(rooms ?? []);

        const inferred = this.inferCadence(rooms ?? [], user?.uid);
        if (inferred) {
          this.cadence.set(inferred);
        }
      });
  }

  selectPlan(plan: UpsellPlan): void {
    this.selectedPlanId.set(plan.id);
    this.analytics.logPaywallPlanSelected(this.data.trigger, plan.id);
  }

  selectScope(scope: 'personal' | 'team'): void {
    this.selectPlan(scope === 'team' ? TEAM_PLANS[1] : PERSONAL_PLANS[1]);
  }

  setCadence(cadence: Cadence): void {
    this.cadence.set(cadence);
  }

  setSquads(squads: number): void {
    this.squads.set(squads);
  }

  get ctaLabel(): string {
    const plan = this.selectedPlan();
    if (plan.scope !== 'team') {
      return `Get ${plan.credits} credits — $${plan.priceUsd}`;
    }

    const org = this.organization();
    return org
      ? `Add ${plan.credits} credits to ${org.name} — $${plan.priceUsd}`
      : 'Create a team to buy shared credits';
  }

  get microcopy(): string {
    const plan = this.selectedPlan();
    if (plan.scope !== 'team') {
      return 'Credits never expire · teammates always join free';
    }
    return this.organization()
      ? 'Shared with every member · never expires · admins can top up'
      : 'Create your team first, then buy credits everyone can use';
  }

  async onCtaClick(): Promise<void> {
    const plan = this.selectedPlan();
    const org = this.organization();

    if (plan.scope === 'team' && !org) {
      // Without an organization there is no pool to buy into yet.
      this.dialog.open(...organizationModalCreator());
      return;
    }

    this.analytics.logPaywallCheckoutStarted(this.data.trigger, plan.id);
    this.isRedirecting.set(true);

    try {
      if (plan.scope === 'team') {
        await this.paymentService.buyBundle(
          BundleName.ORGANIZATION_BUNDLE,
          'usd',
          org.id,
          plan.credits
        );
      } else {
        await this.paymentService.buyBundle(plan.bundleName, 'usd');
      }
    } catch (e) {
      console.error('Could not start checkout', e);
      this.isRedirecting.set(false);
    }
  }

  private inferCadence(
    rooms: Room[],
    userId: string | undefined
  ): Cadence | undefined {
    const dates = rooms
      .filter(room => !!userId && room.createdById === userId)
      .map(room => this.toDate(room.createdAt))
      .filter((date): date is Date => !!date)
      .sort((a, b) => b.getTime() - a.getTime());

    if (dates.length < 3) {
      return undefined;
    }

    const gapsInDays = dates
      .slice(1)
      .map((date, index) =>
        Math.abs(dates[index].getTime() - date.getTime()) / 86400000
      )
      .sort((a, b) => a - b);

    const medianGap = gapsInDays[Math.floor(gapsInDays.length / 2)];
    if (medianGap <= 10) {
      return 'weekly';
    }
    if (medianGap <= 21) {
      return 'biweekly';
    }
    return 'monthly';
  }

  private toDate(value: unknown): Date | undefined {
    const timestamp = value as { toDate?: () => Date; seconds?: number };
    if (timestamp?.toDate) {
      return timestamp.toDate();
    }
    if (typeof timestamp?.seconds === 'number') {
      return new Date(timestamp.seconds * 1000);
    }
    return undefined;
  }
}
