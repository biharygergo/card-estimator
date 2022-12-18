import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  startWith,
  tap,
  withLatestFrom,
} from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { EstimatorService } from 'src/app/services/estimator.service';
import {
  ExportData,
  SerializerService,
} from 'src/app/services/serializer.service';
import { Room } from 'src/app/types';
import { delayedFadeAnimation, fadeAnimation, staggerFadeAnimation } from '../animations';

@Component({
  selector: 'session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.scss'],
  animations: [staggerFadeAnimation, delayedFadeAnimation, fadeAnimation],
})
export class SessionHistoryComponent implements OnInit {
  filter = new FormControl<string>('');

  isLoading = new BehaviorSubject(false);
  previousSessions: Observable<Room[]> = this.estimatorService
    .getPreviousSessions()
    .pipe(tap(() => this.isLoading.next(false)));

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
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.isLoading.next(true);
  }

  downloadResults(room: Room) {
    this.serializerService.exportRoomAsCsv(room);
  }
}
