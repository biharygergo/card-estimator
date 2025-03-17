import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  input,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
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
import { delayedFadeAnimation, fadeAnimation } from 'src/app/shared/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RoomDataService } from '../room-data.service';
import { ConfirmDialogService } from 'src/app/shared/confirm-dialog/confirm-dialog.service';
import { NgClass, AsyncPipe } from '@angular/common';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ToastService } from 'src/app/services/toast.service';

const ADD_CARD_DECK_MODAL = 'add-card-deck';

@Component({
    selector: 'planning-poker-room-controller-panel',
    templateUrl: './room-controller-panel.component.html',
    styleUrls: ['./room-controller-panel.component.scss'],
    animations: [fadeAnimation, delayedFadeAnimation],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        MatCard,
        MatCardContent,
        MatIconButton,
        MatTooltip,
        MatIcon,
        MatButton,
        CountdownTimerComponent,
        MatMenuTrigger,
        MatMenu,
        MatMenuItem,
        MatDivider,
        MatCheckbox,
        NgClass,
        AsyncPipe,
    ],
})
export class RoomControllerPanelComponent implements OnInit, OnDestroy {
  room = input.required<Room>();
  room$ = input.required<Observable<Room>>();
  activeMember$ = input.required<Observable<Member>>();
  rounds = input.required<Round[]>();
  currentRound = input.required<number>();
  isEditingTopic = input.required<boolean>();
  isMuted = input.required<boolean>();
  estimationCardSets = input.required<CardSetValue[]>();
  selectedEstimationCardSetValue = input.required<CardSetValue>();
  isExpanded = input.required<boolean>();

  @Output() sidebarTriggered = new EventEmitter<void>();
  @Output() muteClicked = new EventEmitter<void>();
  @Output() inviteClicked = new EventEmitter<void>();
  @Output() expandClicked = new EventEmitter<void>();

  readonly destroy = new Subject<void>();

  savedCardSets$: Observable<SavedCardSetValue[]> = this.cardDeckService
    .getMyCardDecks()
    .pipe(takeUntil(this.destroy));

  savedCardSets = signal<SavedCardSetValue[]>([]);

  isSmallScreen$ = this.breakpointObserver.observe('(max-width: 800px)').pipe(
    map((result) => result.matches),
    tap((isSmallScreen) => (this.isSmallScreen.set(isSmallScreen)))
  );
  isSmallScreen = signal<boolean>(false);

  readonly localActiveRound = this.roomDataService.localActiveRound;

  readonly newRoundClicked = new Subject<void>();
  readonly newRoundButtonCooldownState$ = createCooldownState();

  readonly inviteButtonClicked = new Subject<void>();
  readonly inviteButtonCooldownState$ = createCooldownState();

  readonly MemberType = MemberType;

  @ViewChild('menuTrigger') private readonly settingsMenuTrigger: MatMenuTrigger;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly analytics: AnalyticsService,
    public readonly permissionsService: PermissionsService,
    @Inject(APP_CONFIG) public config: AppConfig,
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly cardDeckService: CardDeckService,
    private readonly breakpointObserver: BreakpointObserver,
    private readonly roomDataService: RoomDataService,
    private readonly confirmService: ConfirmDialogService,
    private readonly toastService: ToastService,
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
      (cardSets) => (this.savedCardSets.set(cardSets))
    );
  }

  ngOnDestroy(): void {}

  newRound() {
    this.analytics.logClickedNewRound();
    this.estimatorService.newRound(this.room());
  }

  nextRound() {
    this.analytics.logClickedNextRound();

    this.estimatorService.setActiveRound(
      this.room(),
      this.currentRound() + 1,
      false
    );
  }

  changeLocalRound(diff: number) {
    const nextRound = Math.min(
      Math.max(
        0,
        (this.roomDataService.localActiveRound.value ??
          this.room().currentRound ??
          0) + diff
      ),
      Object.keys(this.room().rounds).length - 1
    );

    this.roomDataService.localActiveRound.next(nextRound);
    this.analytics.logClickedChangeLocalRound();
  }

  showResults() {
    this.analytics.logClickedShowResults();
    this.estimatorService.setShowResults(this.room(), this.currentRound(), true);
  }

  clickedUnitsButton() {
    this.analytics.logClickedUnits();
  }

  openRoomConfigurationModal() {
    this.analytics.logClickedOpenRoomConfigurationModal();
    this.dialog.open(
      ...roomConfigurationModalCreator({ roomId: this.room().roomId })
    );
  }

  async leaveRoom() {
    this.analytics.logClickedLeaveRoom();
    if (
      await this.confirmService.openConfirmationDialog({
        title: 'Are you sure you want to leave early?',
        content:
          'Your votes will be saved and you can always rejoin from the "Previous sessions" page. See you soon!',
        positiveText: 'Leave room',
        negativeText: 'Cancel',
      })
    ) {
      if (this.estimatorService.activeMember) {
        await this.estimatorService.updateMemberStatus(
          this.room().roomId,
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
        this.room().roomId,
        cardSet
      );
    } else {
      this.estimatorService.setRoomCardSet(this.room().roomId, cardSet.key);
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
    this.analytics.logTogglePassOption(!this.room().showPassOption);
    this.estimatorService.toggleShowPassOption(
      this.room().roomId,
      !this.room().showPassOption
    );
  }

  toggleAsyncVoting() {
    this.analytics.logToggleAsyncVote(!this.room().isAsyncVotingEnabled);
    this.estimatorService.toggleAsyncVoting(
      this.room().roomId,
      !this.room().isAsyncVotingEnabled
    );
  }

  toggleAnonymousVoting() {
    this.analytics.logToggleAnonymousVote(!this.room().isAsyncVotingEnabled);
    this.estimatorService.toggleAnonymousVoting(
      this.room().roomId,
      !this.room().isAnonymousVotingEnabled
    );
  }

  toggleAutoReveal() {
    this.analytics.logToggleAutoReveal(!this.room().isAutoRevealEnabled);
    this.estimatorService.toggleAutoReveal(
      this.room().roomId,
      !this.room().isAutoRevealEnabled
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
          roomId: this.room().roomId,
        },
      });

      dialogRef.afterClosed().subscribe(() => {});
    }
  }

  async deleteSavedCardSet(cardSetId: string) {
    if (await this.confirmService.openConfirmationDialog({
      title: 'Are you sure you want to delete this card set?',
      content: 'The set will be removed from your saved sets but it will be kept in rooms where it is selected.',
      positiveText: 'Delete',
      negativeText: 'Cancel',
    })) {
      this.cardDeckService.deleteCardDeck(cardSetId).subscribe(() => {
        this.toastService.showMessage('Card set deleted');
      });
    }
    
  }

  async updateMemberType(newType: MemberType) {
    await this.estimatorService.updateMemberType(
      this.room().roomId,
      this.estimatorService.activeMember,
      newType
    );

    this.permissionsService.initializePermissions(
      this.room(),
      this.estimatorService.activeMember.id
    );
  }

  openMenu() {
    this.settingsMenuTrigger.openMenu();
  }

  closeMenu() {
    this.settingsMenuTrigger.closeMenu();
  }
}
