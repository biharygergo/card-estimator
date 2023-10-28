import {
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Observable, Subject, map, takeUntil, tap } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import {
  CardSetValue,
  CustomCardSet,
  Member,
  MemberStatus,
  MemberType,
  Room,
  Round,
  SavedCardSetValue,
} from 'src/app/types';
import {
  cooldownPipe,
  createCooldownState,
  getSortedCardSetValues,
} from 'src/app/utils';
import { roomConfigurationModalCreator } from '../room-configuration-modal/room-configuration-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CardDeckService } from 'src/app/services/card-deck.service';
import { AddCardDeckModalComponent } from '../add-card-deck-modal/add-card-deck-modal.component';
import {
  bounceAnimation,
  delayedFadeAnimation,
  fadeAnimation,
} from 'src/app/shared/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RoomDataService } from '../room-data.service';

const ADD_CARD_DECK_MODAL = 'add-card-deck';

@Component({
  selector: 'planning-poker-room-controller-panel',
  templateUrl: './room-controller-panel.component.html',
  styleUrls: ['./room-controller-panel.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation, bounceAnimation],
})
export class RoomControllerPanelComponent implements OnInit, OnDestroy {
  @Input({ required: true }) room: Room;
  @Input({ required: true }) room$: Observable<Room>;
  @Input({ required: true }) activeMember$: Observable<Member>;
  @Input({ required: true }) rounds: Round[];
  @Input({ required: true }) currentRound: number;
  @Input({ required: true }) isEditingTopic: boolean;
  @Input({ required: true }) isMuted: boolean;
  @Input({ required: true }) estimationCardSets: CardSetValue[];
  @Input({ required: true }) selectedEstimationCardSetValue: CardSetValue;
  @Input({ required: true }) isExpanded: boolean;

  @Output() sidebarTriggered = new EventEmitter<void>();
  @Output() muteClicked = new EventEmitter<void>();
  @Output() inviteClicked = new EventEmitter<void>();
  @Output() expandClicked = new EventEmitter<void>();

  readonly destroy = new Subject<void>();

  savedCardSets$: Observable<SavedCardSetValue[]> = this.cardDeckService
    .getMyCardDecks()
    .pipe(takeUntil(this.destroy));

  savedCardSets: SavedCardSetValue[] = [];

  isSmallScreen$ = this.breakpointObserver.observe('(max-width: 800px)').pipe(
    map((result) => result.matches),
    tap((isSmallScreen) => (this.isSmallScreen = isSmallScreen))
  );
  isSmallScreen: boolean = false;

  readonly localActiveRound = this.roomDataService.localActiveRound;

  readonly newRoundClicked = new Subject<void>();
  readonly newRoundButtonCooldownState$ = createCooldownState();

  readonly inviteButtonClicked = new Subject<void>();
  readonly inviteButtonCooldownState$ = createCooldownState();

  readonly MemberType = MemberType;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly analytics: AnalyticsService,
    public readonly permissionsService: PermissionsService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly cardDeckService: CardDeckService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly roomDataService: RoomDataService
  ) {}

  ngOnInit() {
    this.newRoundClicked
      .pipe(
        tap(() => this.newRound()),
        cooldownPipe(this.newRoundButtonCooldownState$),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.inviteButtonClicked
      .pipe(
        tap(() => this.inviteClicked.emit()),
        cooldownPipe(this.inviteButtonCooldownState$),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.isSmallScreen$.pipe(takeUntil(this.destroy)).subscribe();
    this.savedCardSets$.subscribe(
      (cardSets) => (this.savedCardSets = cardSets)
    );
  }

  ngOnDestroy(): void {}

  newRound() {
    this.analytics.logClickedNewRound();
    this.estimatorService.newRound(this.room);
  }

  nextRound() {
    this.analytics.logClickedNextRound();

    this.estimatorService.setActiveRound(
      this.room,
      this.currentRound + 1,
      false
    );
  }

  changeLocalRound(diff: number) {
    const nextRound = Math.min(
      Math.max(
        0,
        (this.roomDataService.localActiveRound.value ??
          this.room.currentRound ??
          0) + diff
      ),
      Object.keys(this.room.rounds).length - 1
    );

    this.roomDataService.localActiveRound.next(nextRound);
  }

  showResults() {
    this.analytics.logClickedShowResults();
    this.estimatorService.setShowResults(this.room, this.currentRound, true);
  }

  clickedUnitsButton() {
    this.analytics.logClickedUnits();
  }

  openRoomConfigurationModal() {
    this.analytics.logClickedOpenRoomConfigurationModal();
    this.dialog.open(
      ...roomConfigurationModalCreator({ roomId: this.room.roomId })
    );
  }

  async leaveRoom() {
    this.analytics.logClickedLeaveRoom();
    if (
      this.config.runningIn === 'zoom' ||
      confirm('Do you really want to leave this estimation?')
    ) {
      if (this.estimatorService.activeMember) {
        await this.estimatorService.updateMemberStatus(
          this.room.roomId,
          this.estimatorService.activeMember,
          MemberStatus.LEFT_ROOM
        );
      }
      this.router.navigate(['join']);
    }
  }

  setEstimationCardSet(cardSet: CardSetValue) {
    this.analytics.logSelectedCardSet(cardSet.key);
    if (cardSet.key === CustomCardSet) {
      this.estimatorService.setRoomCustomCardSetValue(
        this.room.roomId,
        cardSet
      );
    } else {
      this.estimatorService.setRoomCardSet(this.room.roomId, cardSet.key);
    }
  }

  getCardSetDisplayValues(cardSet: CardSetValue | undefined) {
    if (!cardSet) {
      return '';
    }
    return getSortedCardSetValues(cardSet)
      .map((item) => item.value)
      .join(', ');
  }

  toggleShowPassOption() {
    this.analytics.logTogglePassOption(!this.room.showPassOption);
    this.estimatorService.toggleShowPassOption(
      this.room.roomId,
      !this.room.showPassOption
    );
  }

  toggleAsyncVoting() {
    this.estimatorService.toggleAsyncVoting(
      this.room.roomId,
      !this.room.isAsyncVotingEnabled
    );
  }

  openAddCardDeckModal() {
    if (this.dialog.getDialogById(ADD_CARD_DECK_MODAL) === undefined) {
      this.analytics.logClickedSetCustomCards();
      const dialogRef = this.dialog.open(AddCardDeckModalComponent, {
        id: ADD_CARD_DECK_MODAL,
        width: '90%',
        maxWidth: '600px',
        disableClose: false,
        panelClass: 'custom-dialog',
        data: {
          roomId: this.room.roomId,
        },
      });

      dialogRef.afterClosed().subscribe(() => {});
    }
  }

  async updateMemberType(newType: MemberType) {
    await this.estimatorService.updateMemberType(
      this.room.roomId,
      this.estimatorService.activeMember,
      newType
    );

    this.permissionsService.initializePermissions(
      this.room,
      this.estimatorService.activeMember.id
    );
  }
}
