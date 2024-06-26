import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  distinctUntilChanged,
  EMPTY,
  map,
  Observable,
  of,
  Subject,
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

@Component({
  selector: 'app-round-results',
  templateUrl: './round-results.component.html',
  styleUrls: ['./round-results.component.scss'],
})
export class RoundResultsComponent implements OnInit, OnDestroy {
  @Input() room: Room;
  @Input() roundStatistics: RoundStatistics;
  @Input() currentRound: number;
  @Input() selectedEstimationCardSetValue: CardSetValue;
  @Input() userProfiles$: Observable<UserProfileMap> = EMPTY;
  @Input() showMemberControls: boolean = false;

  organization$: Observable<Organization | undefined> =
    this.organizationService.getMyOrganization();
  organization: Organization | undefined;

  destroyed = new Subject<void>();
  onRevoteClicked = new Subject<void>();

  userProfiles: UserProfileMap = {};
  currentUserId: string | undefined;

  isAnonymousVotingEnabled = this.roomDataService.room$.pipe(
    map((room) => room.isAnonymousVotingEnabled),
    distinctUntilChanged()
  );

  members = this.roomDataService.activeMembersAnonymized$;

  readonly MemberType = MemberType;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    private readonly toastService: ToastService,
    private readonly organizationService: OrganizationService,
    public readonly permissionsService: PermissionsService,
    private readonly roomDataService: RoomDataService
  ) {}

  ngOnInit() {
    this.userProfiles$.pipe(takeUntil(this.destroyed)).subscribe((profiles) => {
      this.userProfiles = profiles;
    });

    this.organization$
      .pipe(takeUntil(this.destroyed))
      .subscribe((org) => (this.organization = org));

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

  async removeMember(member: Member) {
    await this.estimatorService.updateMemberStatus(
      this.room.roomId,
      member,
      MemberStatus.REMOVED_FROM_ROOM
    );
    this.toastService.showMessage(`${member.name} removed from room.`);
  }

  async addToOrganization(memberId: string) {
    await this.organizationService.addMember(this.organization.id, memberId);
    this.toastService.showMessage('Added to organization!');
  }

  memberIdentity(index: number, member: Member) {
    return member.id;
  }

  openMajorityVoteOverrideModal() {
    this.dialog.open(
      ...overrideMajorityVodeModalCreator({
        roomId: this.room.roomId,
        roundId: this.currentRound,
        selectedCardSet: this.selectedEstimationCardSetValue,
      })
    );
  }
}
