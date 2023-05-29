import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, Observable, of, Subject, takeUntil } from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import {
  CardSetValue,
  Member,
  MemberType,
  Room,
  RoundStatistics,
  UserProfileMap,
} from 'src/app/types';

@Component({
  selector: 'app-round-results',
  templateUrl: './round-results.component.html',
  styleUrls: ['./round-results.component.scss'],
})
export class RoundResultsComponent implements OnInit, OnDestroy {
  @Input() room: Room;
  @Input() roundStatistics: RoundStatistics;
  @Input() members: Member[];
  @Input() currentRound: number;
  @Input() selectedEstimationCardSetValue: CardSetValue;
  @Input() userProfiles$: Observable<UserProfileMap> = EMPTY;

  destroyed = new Subject<void>();
  onRevoteClicked = new Subject<void>();

  userProfiles: UserProfileMap = {};
  readonly MemberType = MemberType;

  constructor(private readonly estimatorService: EstimatorService) {}

  ngOnInit() {
    this.userProfiles$.pipe(takeUntil(this.destroyed)).subscribe((profiles) => {
      this.userProfiles = profiles;
    });

    this.onRevoteClicked.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.estimatorService.setActiveRound(this.room, this.currentRound, true);
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
