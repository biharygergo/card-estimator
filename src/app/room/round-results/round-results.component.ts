import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, of, Subject, takeUntil } from 'rxjs';
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
  @Input() userProfiles$: Observable<UserProfileMap> = of({});

  destroyed = new Subject<void>();

  userProfiles: UserProfileMap = {};
  readonly MemberType = MemberType;

  ngOnInit() {
    this.userProfiles$.pipe(takeUntil(this.destroyed)).subscribe((profiles) => {
      this.userProfiles = profiles;
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
