import { ChangeDetectionStrategy, Component, input, Input, OnDestroy, OnInit, signal } from '@angular/core';
import {
  combineLatest,
  first,
  map,
  Observable,
  Subject,
  takeUntil,
} from 'rxjs';
import { getRoomCardSetValue } from 'src/app/pipes/estimate-converter.pipe';
import { EstimatorService } from 'src/app/services/estimator.service';
import { ExportData } from 'src/app/services/serializer.service';
import { isNumericCardSet, Room } from 'src/app/types';
import { AsyncPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';

interface Velocity {
  total: number | undefined;
  cards: string[];
}

@Component({
    selector: 'app-velocity',
    templateUrl: './velocity.component.html',
    styleUrls: ['./velocity.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatIcon,
        MatTooltip,
        AsyncPipe,
    ]
})
export class VelocityComponent implements OnInit, OnDestroy {
  room = input.required<Observable<Room>>();
  roomId = input.required<string>();

  isCardsExpanded = signal<boolean>(false);

  velocity$: Observable<Velocity | undefined>;
  previousSessionVelocity$: Observable<
    { previousSession: Velocity; changePercent: number } | undefined
  >;

  private readonly destroyed = new Subject<void>();

  private previousSessions$: Observable<Room[]>;

  constructor(private readonly estimatorService: EstimatorService) {}

  ngOnInit() {
    this.velocity$ = this.room().pipe(map(this.calculateVelocity));

    this.previousSessions$ = this.estimatorService
      .getPreviousSessions()
      .pipe(first(), takeUntil(this.destroyed));

    this.previousSessionVelocity$ = combineLatest([
      this.velocity$,
      this.previousSessions$,
    ]).pipe(
      map(([currentVelocity, previousSessions]) =>
        this.calculatePreviousSessionVelocity(currentVelocity, previousSessions)
      )
    );
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  calculatePreviousSessionVelocity(
    currentVelocity: Velocity,
    sessions: Room[]
  ) {
    const oneBeforeCurrentIndex =
      sessions.findIndex((room) => room.roomId === this.roomId()) + 1;
    if (oneBeforeCurrentIndex > sessions.length) {
      return undefined;
    }

    const velocity = this.calculateVelocity(sessions[oneBeforeCurrentIndex]);

    // The previous session was non-numeric or no votes
    if (velocity?.total === undefined || velocity?.total === 0) {
      return undefined;
    }

    return {
      previousSession: velocity,
      changePercent:
        Math.round((currentVelocity.total / velocity.total) * 100) - 100,
    };
  }

  calculateVelocity(room?: Room): Velocity | undefined {
    if (!room) {
      return undefined;
    }
    const exportData = new ExportData(room, true);

    const isAllNumericCardSet = isNumericCardSet(getRoomCardSetValue(room));
    let total = undefined;
    const cards = exportData.rows
      .reverse()
      .map((row) => {
        return row.mostPopularVoteOrOverride;
      })
      .filter((card) => !!card);

    if (isAllNumericCardSet) {
      total = cards
        .map((card) => {
          return +card;
        })
        .reduce((acc, curr) => acc + curr, 0);
    }

    return {
      total,
      cards,
    };
  }
}
