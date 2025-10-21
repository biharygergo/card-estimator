import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnDestroy,
  OnInit,
  signal,
  Signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  startWith,
  Subject,
  switchMap,
  takeUntil,
  pairwise,
  filter,
} from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { ToastService } from 'src/app/services/toast.service';
import { ReactionsService } from 'src/app/services/reactions.service';
import { avatarModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import {
  CardSetValue,
  Member,
  MemberStatus,
  MemberType,
  Organization,
  Room,
  RoundStatistics,
  UserProfileMap,
} from 'src/app/types';
import { overrideMajorityVodeModalCreator } from '../override-majority-vote-modal/override-majority-vote-modal.component';
import { PermissionsService } from 'src/app/services/permissions.service';
import { RoomDataService } from '../room-data.service';
import { EstimateConverterPipe } from '../../pipes/estimate-converter.pipe';
import { MatDivider } from '@angular/material/divider';
import {
  MatMenuTrigger,
  MatMenu,
  MatMenuContent,
  MatMenuItem,
} from '@angular/material/menu';
import { MatIconButton } from '@angular/material/button';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import {
  MatChipSet,
  MatChip,
  MatChipAvatar,
  MatChipRemove,
} from '@angular/material/chips';
import {
  MatList,
  MatListSubheaderCssMatStyler,
  MatListItem,
} from '@angular/material/list';
import { toSignal } from '@angular/core/rxjs-interop';
import { isEqual } from 'lodash';

const NUDGE_TIMER_DURATION = 20000; // 20 seconds
@Component({
  selector: 'app-round-results',
  templateUrl: './round-results.component.html',
  styleUrls: ['./round-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatList,
    MatListSubheaderCssMatStyler,
    MatListItem,
    MatChipSet,
    MatChip,
    MatChipAvatar,
    MatIcon,
    MatChipRemove,
    MatTooltip,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatDivider,
    AsyncPipe,
    DecimalPipe,
    EstimateConverterPipe
],
})
export class RoundResultsComponent implements OnInit, OnDestroy {
  room = input.required<Room>();
  roundStatistics = input.required<RoundStatistics>();
  currentRound = input.required<number>();
  selectedEstimationCardSetValue = input.required<CardSetValue>();
  userProfiles$ = input<Observable<UserProfileMap>>(EMPTY);
  showMemberControls = input<boolean>(false);

  organization$: Observable<Organization | undefined> =
    this.organizationService.getMyOrganization();
  organization = signal<Organization | undefined>(undefined);

  destroyed = new Subject<void>();
  onRevoteClicked = new Subject<void>();

  userProfiles = signal<UserProfileMap>({});
  currentUserId = signal<string | undefined>(undefined);
  showNudgeButtons = signal<boolean>(false);
  
  private nudgeTimerHandle?: ReturnType<typeof setTimeout>;

  isAnonymousVotingEnabled = this.roomDataService.room$.pipe(
    map(room => room.isAnonymousVotingEnabled),
    distinctUntilChanged()
  );

  members = this.roomDataService.activeMembersAnonymized$;
  membersSignal: Signal<Member[]> = toSignal(
    this.roomDataService.activeMembersAnonymized$,
    { initialValue: [] }
  );
  recentlyActiveMembers: Signal<{ [memberId: string]: boolean }> = toSignal(
    this.roomDataService.room$.pipe(
      map(room => room.roomId),
      distinctUntilChanged(),
      switchMap(roomId =>
        this.estimatorService.getRecentlyActiveMemberIds(roomId)
      ),
      map(memberIds =>
        memberIds.reduce((acc, curr) => ({ ...acc, [curr]: true }), {})
      ),
      distinctUntilChanged(isEqual),
      startWith({})
    )
  );

  readonly MemberType = MemberType;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly toastService: ToastService,
    readonly organizationService: OrganizationService,
    public readonly permissionsService: PermissionsService,
    private readonly roomDataService: RoomDataService,
    private readonly reactionsService: ReactionsService
  ) {}

  ngOnInit() {
    this.userProfiles$()
      .pipe(takeUntil(this.destroyed))
      .subscribe(profiles => {
        this.userProfiles.set(profiles);
      });

    this.organization$
      .pipe(takeUntil(this.destroyed))
      .subscribe(org => this.organization.set(org));

    this.authService.user
      .pipe(takeUntil(this.destroyed))
      .subscribe(user => this.currentUserId.set(user?.uid));

    this.onRevoteClicked.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.estimatorService.setActiveRound(
        this.room(),
        this.currentRound(),
        true
      );
    });

    // Watch for first vote in current round to start nudge timer
    this.roomDataService.room$
      .pipe(
        map(room => {
          const round = room?.rounds?.[this.currentRound()];
          if (!round || round.show_results) return null;
          
          const estimates = round.estimates || {};
          const estimateCount = Object.keys(estimates).length;
          return { roundId: this.currentRound(), estimateCount, showResults: round.show_results };
        }),
        distinctUntilChanged((prev, curr) => 
          prev?.roundId === curr?.roundId && 
          prev?.estimateCount === curr?.estimateCount &&
          prev?.showResults === curr?.showResults
        ),
        pairwise(),
        filter(([prev, curr]) => 
          // First vote came in: previous had 0 votes, current has 1+ votes
          curr !== null && 
          prev?.estimateCount === 0 && 
          curr.estimateCount > 0 &&
          !curr.showResults
        ),
        takeUntil(this.destroyed)
      )
      .subscribe(() => {
        // Clear any existing timer
        if (this.nudgeTimerHandle) {
          clearTimeout(this.nudgeTimerHandle);
        }
        
        // Reset button visibility
        this.showNudgeButtons.set(false);
        
        // Start 20-second timer
        this.nudgeTimerHandle = setTimeout(() => {
          // Check if there are still non-voters
          const nonVoters = this.getNonVoters();
          if (nonVoters.length > 0) {
            this.showNudgeButtons.set(true);
          }
        }, NUDGE_TIMER_DURATION); // 20 seconds
      });

    // Reset button when results are shown or round changes
    this.roomDataService.room$
      .pipe(
        map(room => ({
          roundId: this.currentRound(),
          showResults: room?.rounds?.[this.currentRound()]?.show_results
        })),
        distinctUntilChanged((prev, curr) => 
          prev.roundId === curr.roundId && prev.showResults === curr.showResults
        ),
        startWith(null),
        pairwise(),
        takeUntil(this.destroyed)
      )
      .subscribe(([prev, curr]) => {
        if (!curr) return;
        
        // Clear timer and hide buttons when results are shown or round changes
        const roundChanged = prev && prev.roundId !== curr.roundId;
        if (curr.showResults || roundChanged) {
          if (this.nudgeTimerHandle) {
            clearTimeout(this.nudgeTimerHandle);
          }
          this.showNudgeButtons.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.nudgeTimerHandle) {
      clearTimeout(this.nudgeTimerHandle);
    }
    this.destroyed.next();
    this.destroyed.complete();
  }

  openAvatarSelectorModal(userId: string) {
    if (userId !== this.currentUserId()) return;
    this.dialog.open(...avatarModalCreator({ openAtTab: 'avatar' }));
  }

  async removeMember(member: Member) {
    await this.estimatorService.updateMemberStatus(
      this.room().roomId,
      member,
      MemberStatus.REMOVED_FROM_ROOM
    );
    this.toastService.showMessage(`${member.name} removed from room.`);
  }

  async addToOrganization(memberId: string) {
    await this.organizationService.addMember(this.organization().id, memberId);
    this.toastService.showMessage('Added to organization!');
  }

  memberIdentity(index: number, member: Member) {
    return member.id;
  }

  openMajorityVoteOverrideModal() {
    this.dialog.open(
      ...overrideMajorityVodeModalCreator({
        roomId: this.room().roomId,
        roundId: this.currentRound(),
        selectedCardSet: this.selectedEstimationCardSetValue(),
      })
    );
  }

  async nudgeMember(member: Member) {
    await this.reactionsService.sendNudge(member.id, this.room().roomId);
    this.toastService.showMessage(`Nudged ${member.name}!`);
  }

  canNudgeMember(member: Member): boolean {
    // Can nudge if:
    // 1. Not yourself
    // 2. Member is an estimator (not observer)
    // 3. Member hasn't voted yet in current round
    // 4. Results not shown yet
    const round = this.room()?.rounds?.[this.currentRound()];
    if (!round || round.show_results) return false;
    
    if (member.id === this.currentUserId()) return false;
    if (member.type !== MemberType.ESTIMATOR) return false;
    
    const memberEstimate = round?.estimates?.[member.id];
    return memberEstimate === undefined; // Only nudge if they haven't voted
  }

  getNonVoters(): Member[] {
    const round = this.room()?.rounds?.[this.currentRound()];
    if (!round || round.show_results) return [];

    return this.membersSignal().filter(member => {
      if (member.id === this.currentUserId()) return false;
      if (member.type !== MemberType.ESTIMATOR) return false;
      const memberEstimate = round?.estimates?.[member.id];
      return memberEstimate === undefined;
    });
  }

  canShowNudgeButton(member: Member): boolean {
    // Show nudge button if:
    // 1. Timer has elapsed (showNudgeButtons is true)
    // 2. Member can be nudged (using existing canNudgeMember logic)
    // 3. At least one vote has been cast in current round (to avoid flash on new round)
    
    if (!this.showNudgeButtons() || !this.canNudgeMember(member)) {
      return false;
    }
    
    const round = this.room()?.rounds?.[this.currentRound()];
    if (!round) return false;
    
    const estimates = round.estimates || {};
    const estimateCount = Object.keys(estimates).length;
    
    // Only show if at least one vote has been cast (timer should have started)
    return estimateCount > 0;
  }
}
