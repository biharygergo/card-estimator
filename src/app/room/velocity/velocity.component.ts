import { Component, Input, OnInit } from '@angular/core';
import {
  combineLatest,
  map,
  Observable,
} from 'rxjs';
import { getRoomCardSetValue } from 'src/app/pipes/estimate-converter.pipe';
import { EstimatorService } from 'src/app/services/estimator.service';
import { ExportData } from 'src/app/services/serializer.service';
import { isNumericCardSet, Room } from 'src/app/types';

interface Velocity {
  total: number | undefined;
  cards: string[];
}

@Component({
  selector: 'app-velocity',
  templateUrl: './velocity.component.html',
  styleUrls: ['./velocity.component.scss'],
})
export class VelocityComponent implements OnInit {
  @Input() roomId!: string;

  isCardsExpanded = false;

  velocity$: Observable<Velocity | undefined>;
  previousSessionVelocity$: Observable<
    { previousSession: Velocity; changePercent: number } | undefined
  >;

  constructor(private readonly estimatorService: EstimatorService) {}

  ngOnInit() {
    this.velocity$ = this.estimatorService
      .getRoomById(this.roomId)
      .pipe(map(this.calculateVelocity));

    this.previousSessionVelocity$ = combineLatest([
      this.velocity$,
      this.estimatorService.getPreviousSessions(),
    ]).pipe(
      map(([currentVelocity, sessions]) => {
        const oneBeforeCurrentIndex =
          sessions.findIndex((room) => room.roomId === this.roomId) + 1;
        if (oneBeforeCurrentIndex > sessions.length) {
          return undefined;
        }

        const velocity = this.calculateVelocity(
          sessions[oneBeforeCurrentIndex]
        );

        // The previous session was non-numeric
        if (velocity.total === undefined) {
          return undefined;
        }

        return {
          previousSession: velocity,
          changePercent:
            Math.round((currentVelocity.total / velocity.total) * 100) - 100,
        };
      })
    );
  }

  calculateVelocity(room: Room) {
    const exportData = new ExportData(room, true);

    const isAllNumericCardSet = isNumericCardSet(getRoomCardSetValue(room));
    let total = undefined;
    const cards = exportData.rows
      .reverse()
      .map((row) => {
        return row.mostPopularVote;
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
