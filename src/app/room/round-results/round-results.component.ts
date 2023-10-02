import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable, of, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { avatarModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
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
  currentUserId: string | undefined;

  readonly MemberType = MemberType;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog
  ) {}

  ngOnInit() {
    this.userProfiles$.pipe(takeUntil(this.destroyed)).subscribe((profiles) => {
      this.userProfiles = profiles;
    });

    this.authService.user
      .pipe(takeUntil(this.destroyed))
      .subscribe((user) => (this.currentUserId = user?.uid));

    this.onRevoteClicked.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.estimatorService.setActiveRound(this.room, this.currentRound, true);
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }

  openAvatarSelectorModal(userId: string) {
    if (userId !== this.currentUserId) return;
    this.dialog.open(...avatarModalCreator({ openAtTab: 'avatar' }));
  }
}
