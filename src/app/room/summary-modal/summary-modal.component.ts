import { Clipboard } from '@angular/cdk/clipboard';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import {
  BehaviorSubject,
  Observable,
  Subject,
  combineLatest,
  delay,
  distinctUntilChanged,
  first,
  map,
  shareReplay,
  takeUntil,
  tap,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { MeteredUsageService } from 'src/app/services/metered-usage.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { SerializerService } from 'src/app/services/serializer.service';
import { ToastService } from 'src/app/services/toast.service';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import Typed from 'typed.js';
import { AsyncPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

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
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    data: {
      roomId,
    },
  },
];

@Component({
  selector: 'app-summary-modal',
  templateUrl: './summary-modal.component.html',
  styleUrls: ['./summary-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatButton,
    MatIcon,
    MatDialogActions,
    MatDialogClose,
    AsyncPipe,
  ],
})
export class SummaryModalComponent implements OnInit, OnDestroy, AfterViewInit {
  typewriter: Typed;
  summaryResponse$ = new BehaviorSubject<
    { text: string; static: boolean } | undefined
  >(undefined);

  isRoomProper$: Observable<boolean> = this.estimatorService
    .getRoomById(this.dialogData.roomId)
    .pipe(
      map(room => {
        const rounds = Object.values(room.rounds);
        return rounds.length > 1 && room.members.length > 1;
      }),
      distinctUntilChanged(),
      shareReplay(1)
    );

  remainingUsage$: Observable<number> = this.meteredUsageService
    .getMeteredUsage('chatgpt-query')
    .pipe(
      map(usage => {
        return USAGE_LIMIT - usage.length;
      }),
      shareReplay()
    );

  failedPrecondition$: Observable<
    'room-size' | 'user' | 'credits' | undefined
  > = combineLatest([this.isRoomProper$, this.authService.user]).pipe(
    map(([isRoomProper, user]) => {
      if (user.isAnonymous) {
        return 'user';
      } else if (!isRoomProper) {
        return 'room-size';
      }

      return undefined;
    })
  );

  summaryResponseAsObs = combineLatest([
    this.summaryResponse$.asObservable(),
    this.failedPrecondition$,
  ]).pipe(
    tap(([response, failedPrecondition]) => {
      this.typewriter?.destroy();
      document.getElementById('response-text').innerHTML = '';

      if (
        response &&
        (failedPrecondition === undefined || failedPrecondition === 'credits')
      ) {
        if (response.static) {
          document.getElementById('response-text').innerHTML = response.text;
        } else {
          this.typewriter = new Typed('#response-text', {
            strings: [response.text],
            typeSpeed: 5,
            showCursor: false,
          });
        }
      }
    })
  );

  latestRoomSummary$: Observable<string | undefined> = this.estimatorService
    .getRoomSummaries(this.dialogData.roomId)
    .pipe(
      map(summaries => {
        return summaries.length ? summaries[0].summary : undefined;
      })
    );

  destroy = new Subject<void>();
  isLoadingResults = false;

  readonly USAGE_LIMIT = USAGE_LIMIT;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly meteredUsageService: MeteredUsageService,
    private readonly permissionsService: PermissionsService,
    private readonly toastService: ToastService,
    public readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly analyticsService: AnalyticsService,
    private readonly serializer: SerializerService,
    private readonly clipboard: Clipboard,
    @Inject(MAT_DIALOG_DATA) private dialogData: SummaryModalData
  ) {}

  ngOnInit() {
    combineLatest([this.latestRoomSummary$, this.failedPrecondition$])
      .pipe(first(), takeUntil(this.destroy))
      .subscribe(([summary, failedPrecondition]) => {
        if (summary) {
          if (!this.summaryResponse$.value) {
            this.summaryResponse$.next({ text: summary, static: true });
          }
        } else if (failedPrecondition === undefined) {
          this.generateSummary();
        }
      });
  }

  ngAfterViewInit(): void {
    this.summaryResponseAsObs.pipe(takeUntil(this.destroy)).subscribe();
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async generateSummary() {
    try {
      this.isLoadingResults = true;
      this.summaryResponse$.next(undefined);
      const room = await this.estimatorService.getRoom(this.dialogData.roomId);
      const serialized = this.serializer.getRoomAsCsv(room);

      const { data } = await this.estimatorService.generateRoomSummary(
        room.roomId,
        serialized
      );
      this.summaryResponse$.next({ text: data as string, static: false });
      this.analyticsService.logClickedGenerateSummary();
    } finally {
      this.isLoadingResults = false;
    }
  }

  copyToClipboard() {
    this.clipboard.copy(this.summaryResponse$.value.text);
    this.toastService.showMessage('Summary copied to clipboard!');
    this.analyticsService.logClickedCopySummaryToClipboard();
  }
}
