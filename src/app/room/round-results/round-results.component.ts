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
} from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { ToastService } from 'src/app/services/toast.service';
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
import { NgIf, AsyncPipe, DecimalPipe } from '@angular/common';
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
    NgIf,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuContent,
    MatMenuItem,
    MatDivider,
    AsyncPipe,
    DecimalPipe,
    EstimateConverterPipe,
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

  isAnonymousVotingEnabled = this.roomDataService.room$.pipe(
    map(room => room.isAnonymousVotingEnabled),
    distinctUntilChanged()
  );

  members = this.roomDataService.activeMembersAnonymized$;
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
    private readonly roomDataService: RoomDataService
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
  }

  ngOnDestroy(): void {
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
}
