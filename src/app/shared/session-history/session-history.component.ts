import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  map,
  Observable,
  startWith,
  withLatestFrom,
} from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import {
  ExportData,
  SerializerService,
} from 'src/app/services/serializer.service';
import { Room } from 'src/app/types';
import { delayedFadeAnimation, staggerFadeAnimation } from '../animations';

@Component({
  selector: 'session-history',
  templateUrl: './session-history.component.html',
  styleUrls: ['./session-history.component.scss'],
  animations: [staggerFadeAnimation, delayedFadeAnimation]
})
export class SessionHistoryComponent implements OnInit {
  filter = new FormControl();

  previousSessions: Observable<Room[]> =
    this.estimatorService.getPreviousSessions();

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
    private readonly serializerService: SerializerService
  ) {}

  ngOnInit(): void {}

  downloadResults(room: Room) {
    this.serializerService.exportRoomAsCsv(room);
  }
}
