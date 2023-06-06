import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  from,
  map,
  Observable,
  startWith,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import {
  ExportData,
  SerializerService,
} from 'src/app/services/serializer.service';
import { Room } from 'src/app/types';
import {
  delayedFadeAnimation,
  fadeAnimation,
  staggerFadeAnimation,
} from '../animations';
import { PaymentService } from 'src/app/services/payment.service';
import { MatDialog } from '@angular/material/dialog';
import { premiumLearnMoreModalCreator } from '../premium-learn-more/premium-learn-more.component';
import { AnalyticsService } from 'src/app/services/analytics.service';

@Component({
  selector: 'session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.scss'],
  animations: [staggerFadeAnimation, delayedFadeAnimation, fadeAnimation],
})
export class SessionHistoryComponent implements OnInit {
  filter = new FormControl<string>('');

  isLoading = new BehaviorSubject(false);

  isPremium$ = from(this.paymentsService.isPremiumSubscriber());

  previousSessions: Observable<Room[]> = this.isPremium$.pipe(
    switchMap((isPremium) => {
      return this.estimatorService
        .getPreviousSessions(isPremium ? undefined : 3)
        .pipe(tap(() => this.isLoading.next(false)));
    })
  );

  exportData: Observable<{ [roomId: string]: ExportData }> =
    this.previousSessions.pipe(
      map((sessions) => {
        return sessions.reduce((acc, curr) => {
          acc[curr.id] = new ExportData(curr);
          return acc;
        }, {});
      })
    );

  filteredSessions: Observable<Room[]> = this.filter.valueChanges.pipe(
    startWith(''),
    debounceTime(200),
    withLatestFrom(this.previousSessions),
    map(([filterString, sessions]: [string, Room[]]) => {
      return sessions.filter((session) =>
        Object.values(session.rounds)
          .map((round) => round.topic)
          .some((topicName) =>
            topicName.toLowerCase().includes(filterString.toLowerCase())
          )
      );
    })
  );

  constructor(
    private estimatorService: EstimatorService,
    private readonly serializerService: SerializerService,
    public readonly permissionsService: PermissionsService,
    private readonly paymentsService: PaymentService,
    private readonly analytics: AnalyticsService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.isLoading.next(true);
  }

  downloadResults(room: Room) {
    this.serializerService.exportRoomAsCsv(room);
  }

  clickedLearnMorePremium() {
    this.analytics.logClickedLearnMorePremium('history');
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
