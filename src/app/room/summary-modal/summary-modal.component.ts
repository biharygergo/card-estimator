import { Clipboard } from '@angular/cdk/clipboard';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  first,
  map,
  share,
  shareReplay,
  takeUntil,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { MeteredUsageService } from 'src/app/services/metered-usage.service';
import { PaymentService } from 'src/app/services/payment.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SerializerService } from 'src/app/services/serializer.service';
import { ToastService } from 'src/app/services/toast.service';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { premiumLearnMoreModalCreator } from 'src/app/shared/premium-learn-more/premium-learn-more.component';

export interface SummaryModalData {
  roomId: string;
}

const USAGE_LIMIT = 5;

export const summaryModalCreator = ({
  roomId,
}: SummaryModalData): ModalCreator<SummaryModalComponent> => [
  SummaryModalComponent,
  {
    id: 'summary-modal',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    data: {
      roomId,
    },
  },
];

@Component({
  selector: 'app-summary-modal',
  templateUrl: './summary-modal.component.html',
  styleUrls: ['./summary-modal.component.scss'],
})
export class SummaryModalComponent {
  summaryResponse$ = new BehaviorSubject<string | undefined>(undefined);

  isRoomProper$: Observable<boolean> = this.estimatorService
    .getRoomById(this.dialogData.roomId)
    .pipe(
      map((room) => {
        const rounds = Object.values(room.rounds);
        return rounds.length > 2 && room.members.length > 1;
      }),
      distinctUntilChanged(),
      shareReplay(1),
    );

  latestRoomSummary$: Observable<string | undefined> = this.estimatorService
    .getRoomSummaries(this.dialogData.roomId)
    .pipe(
      map((summaries) => {
        return summaries.length ? summaries[0].summary : undefined;
      })
    );

  remainingUsage$: Observable<number> = this.meteredUsageService
    .getMeteredUsage('chatgpt-query')
    .pipe(
      map((usage) => {
        return USAGE_LIMIT - usage.length;
      }),
      shareReplay()
    );

  isPremiumSubscriber$ = this.permissionsService.hasPremiumAccess();

  showOutOfCredits$: Observable<boolean> = combineLatest([
    this.remainingUsage$,
    this.isPremiumSubscriber$,
  ]).pipe(
    map(([remainingUsage, isPremium]) => {
      return !isPremium && remainingUsage <= 0;
    })
  );

  destroy = new Subject<void>();
  readonly USAGE_LIMIT = USAGE_LIMIT;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly meteredUsageService: MeteredUsageService,
    private readonly permissionsService: PermissionsService,
    private readonly toastService: ToastService,
    public readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly paymentService: PaymentService,
    private readonly analyticsService: AnalyticsService,
    private readonly serializer: SerializerService,
    private readonly clipboard: Clipboard,
    @Inject(MAT_DIALOG_DATA) private dialogData: SummaryModalData
  ) {}

  ngOnInit() {
    combineLatest([
      this.latestRoomSummary$,
      this.showOutOfCredits$,
      this.isRoomProper$,
    ])
      .pipe(first(), takeUntil(this.destroy))
      .subscribe(([summary, outOfCredits, isRoomProper]) => {
        if (summary) {
          this.summaryResponse$.next(summary);
        } else if (!outOfCredits && isRoomProper) {
          this.generateSummary();
        }
      });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async generateSummary() {
    this.summaryResponse$.next(undefined);
    const room = await this.estimatorService.getRoom(this.dialogData.roomId);
    const serialized = this.serializer.getRoomAsCsv(room);

    const { data } = await this.estimatorService.generateRoomSummary(
      room.roomId,
      serialized
    );
    this.summaryResponse$.next(data as string);
  }

  copyToClipboard() {
    this.clipboard.copy(this.summaryResponse$.value);
    this.toastService.showMessage('Summary copied to clipboard!');
  }

  upgradeToPremium() {
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
