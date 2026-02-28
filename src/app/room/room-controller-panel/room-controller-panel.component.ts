import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Inject,
  input,
  OnDestroy,
  OnInit,
  Output,
  signal,
  ViewChild,
} from '@angular/core';
import { Observable, Subject, map, takeUntil, tap, filter, distinctUntilChanged, first } from 'rxjs';
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import {
  CardSetValue,
  Member,
  MemberStatus,
  Room,
  Round,
  SavedCardSetValue,
  TimerState,
} from 'src/app/types';
import {
  cooldownPipe,
  createCooldownState,
} from 'src/app/utils';
import { roomConfigurationModalCreator } from '../room-configuration-modal/room-configuration-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CardDeckService } from 'src/app/services/card-deck.service';
import { collapseAnimation, delayedFadeAnimation, fadeAnimation } from 'src/app/shared/animations';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RoomDataService } from '../room-data.service';
import { ConfirmDialogService } from 'src/app/shared/confirm-dialog/confirm-dialog.service';
import { AsyncPipe } from '@angular/common';
import { MatDivider } from '@angular/material/divider';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconButton, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { ToastService } from 'src/app/services/toast.service';
import { votingSettingsModalCreator } from '../voting-settings-modal/voting-settings-modal.component';
import { cardSetsModalCreator } from '../card-sets-modal/card-sets-modal.component';
import { changeRoleModalCreator } from '../change-role-modal/change-role-modal.component';

@Component({
  selector: 'planning-poker-room-controller-panel',
  templateUrl: './room-controller-panel.component.html',
  styleUrls: ['./room-controller-panel.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation, collapseAnimation],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    MatExpansionModule,
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
    map(result => result.matches),
    tap(isSmallScreen => this.isSmallScreen.set(isSmallScreen))
  );
  isSmallScreen = signal<boolean>(false);
  
  // Collapsible section states (with localStorage persistence)
  private readonly STORAGE_KEY_ROOM_INFO = 'controlPanel.roomInfoCollapsed';
  private readonly STORAGE_KEY_TIMER = 'controlPanel.timerCollapsed';
  
  isRoomInfoCollapsed = signal<boolean>(true); // Will be set properly in ngOnInit
  isTimerCollapsed = signal<boolean>(true); // Will be set properly in ngOnInit
  private collapseStatesInitialized = false;
  
  private loadCollapseState(key: string, defaultCollapsed: boolean): boolean {
    try {
      const stored = localStorage.getItem(key);
      // If no stored value, use the default based on user role
      if (stored === null) {
        return defaultCollapsed;
      }
      return stored === 'true';
    } catch {
      return defaultCollapsed;
    }
  }
  
  private saveCollapseState(key: string, value: boolean): void {
    try {
      localStorage.setItem(key, value.toString());
    } catch {
      // localStorage not available
    }
  }
  
  private initializeCollapseStates(isCreator: boolean): void {
    if (this.collapseStatesInitialized) return;
    this.collapseStatesInitialized = true;
    
    // For creators: default to open (false), for non-creators: default to closed (true)
    const defaultCollapsed = !isCreator;
    
    this.isRoomInfoCollapsed.set(this.loadCollapseState(this.STORAGE_KEY_ROOM_INFO, defaultCollapsed));
    this.isTimerCollapsed.set(this.loadCollapseState(this.STORAGE_KEY_TIMER, defaultCollapsed));
  }

  readonly localActiveRound = this.roomDataService.localActiveRound;

  readonly newRoundClicked = new Subject<void>();
  readonly newRoundButtonCooldownState$ = createCooldownState();

  @ViewChild('menuTrigger')
  private readonly settingsMenuTrigger: MatMenuTrigger;

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
    private readonly toastService: ToastService
  ) {}

  ngOnInit() {
    this.newRoundClicked
      .pipe(
        tap(() => this.newRound()),
        cooldownPipe(this.newRoundButtonCooldownState$),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.isSmallScreen$.pipe(takeUntil(this.destroy)).subscribe();
    this.savedCardSets$.subscribe(cardSets => this.savedCardSets.set(cardSets));
    
    // Initialize collapse states and watch for timer changes
    this.activeMember$().pipe(
      takeUntil(this.destroy)
    ).subscribe(member => {
      if (member) {
        const isCreator = this.room().createdById === member.id;
        this.initializeCollapseStates(isCreator);
      }
    });
    
    // Auto-expand timer section when timer becomes active
    this.room$().pipe(
      map(room => room?.timer?.state),
      filter((state): state is TimerState => state !== undefined),
      distinctUntilChanged(),
      takeUntil(this.destroy)
    ).subscribe(timerState => {
      if (timerState === TimerState.ACTIVE && this.isTimerCollapsed()) {
        this.isTimerCollapsed.set(false);
        // Don't save to localStorage - this is an automatic expansion
      }
    });
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
    this.estimatorService.setShowResults(
      this.room(),
      this.currentRound(),
      true
    );
  }

  openRoomConfigurationModal() {
    this.analytics.logClickedOpenRoomConfigurationModal();
    this.dialog.open(
      ...roomConfigurationModalCreator({ roomId: this.room().roomId })
    );
  }

  openVotingSettingsModal() {
    this.dialog.open(
      ...votingSettingsModalCreator({ room: this.room() })
    );
  }

  openCardSetsModal() {
    this.analytics.logClickedUnits();
    this.dialog.open(
      ...cardSetsModalCreator({
        room: this.room(),
        estimationCardSets: this.estimationCardSets(),
        selectedEstimationCardSetValue: this.selectedEstimationCardSetValue(),
        savedCardSets: this.savedCardSets(),
      })
    );
  }

  openChangeRoleModal() {
    this.activeMember$()
      .pipe(first())
      .subscribe(member => {
        if (member) {
          this.dialog.open(
            ...changeRoleModalCreator({
              room: this.room(),
              currentMemberType: member.type,
            })
          );
        }
      });
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

  async toggleAutoReveal() {
    this.analytics.logToggleAutoReveal(!this.room().isAutoRevealEnabled);
    this.estimatorService.toggleAutoReveal(
      this.room().roomId,
      !this.room().isAutoRevealEnabled
    );
    this.toastService.showMessage(
      'Auto reveal is now ' +
        (!this.room().isAutoRevealEnabled ? 'enabled' : 'disabled') +
        '.'
    );
  }

  openMenu() {
    this.settingsMenuTrigger.openMenu();
  }

  closeMenu() {
    this.settingsMenuTrigger.closeMenu();
  }
  
  toggleRoomInfoCollapsed() {
    const newValue = !this.isRoomInfoCollapsed();
    this.isRoomInfoCollapsed.set(newValue);
    this.saveCollapseState(this.STORAGE_KEY_ROOM_INFO, newValue);
  }
  
  toggleTimerCollapsed() {
    const newValue = !this.isTimerCollapsed();
    this.isTimerCollapsed.set(newValue);
    this.saveCollapseState(this.STORAGE_KEY_TIMER, newValue);
  }
}
