import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  share,
  Subject,
  switchMap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import {
  AuthorizationMetadata,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROOM_CONFIGURATION,
  Member,
  MemberStatus,
  Organization,
  PermissionsMap,
  PERMISSIONS_CATALOG_MAP,
  Room,
  RoomConfiguration,
  RoomPermissionId,
  UserRole,
} from 'src/app/types';
import { isEqual } from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
import { organizationModalCreator } from 'src/app/shared/organization-modal/organization-modal.component';
import { OrganizationService } from 'src/app/services/organization.service';
import { AuthService } from 'src/app/services/auth.service';
import { PaymentService } from 'src/app/services/payment.service';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from 'src/app/shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { premiumLearnMoreModalCreator } from 'src/app/shared/premium-learn-more/premium-learn-more.component';
const ROOM_CONFIGURATION_MODAL = 'roomConfigurationModal';

export interface RoomConfigurationModalData {
  roomId: string;
}

export const roomConfigurationModalCreator = ({
  roomId,
}: RoomConfigurationModalData): ModalCreator<RoomConfigurationModalComponent> => [
  RoomConfigurationModalComponent,
  {
    id: ROOM_CONFIGURATION_MODAL,
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    data: {
      roomId,
    },
  },
];

interface SelectOption<T> {
  value: T;
  label: string;
}

class ChipOption<T> {
  selectedValues: T[] = [];
  selectedValuesMap: { [key: string]: T };

  constructor(
    public prompt: string,
    public icon: string,
    public options: SelectOption<T>[],
    initialSelection: T[],
    private onSelectionUpdated: () => {}
  ) {
    this.setSelection(initialSelection);
  }

  toggleOption(option: T) {
    const key = this.createKey(option);
    if (this.selectedValuesMap[key]) {
      delete this.selectedValuesMap[key];
    } else {
      this.selectedValuesMap[key] = option;
    }

    this.selectedValues = Object.values(this.selectedValuesMap);
    this.onSelectionUpdated();
  }

  setSelection(values: T[]) {
    this.selectedValues = [...values];
    this.selectedValuesMap = values.reduce((acc, curr) => {
      acc[this.createKey(curr)] = curr;
      return acc;
    }, {});
  }

  isSelected(option: T) {
    return !!this.selectedValuesMap[this.createKey(option)];
  }

  private createKey(option: T) {
    return JSON.stringify(option);
  }
}

const CREATOR_OPTION = { value: UserRole.ROOM_CREATOR, label: 'Creator' };
const ESTIMATOR_OPTION = {
  value: UserRole.ROOM_MEMBER_ESTIMATOR,
  label: 'Estimators',
};
const OBSERVER_OPTION = {
  value: UserRole.ROOM_MEMBER_OBSERVER,
  label: 'Observers',
};

function createChipOptionForPermission(
  permission: RoomPermissionId,
  icon: string,
  onSelectionUpdated: () => {},
  defaultOptions: SelectOption<UserRole>[] = [
    CREATOR_OPTION,
    ESTIMATOR_OPTION,
    OBSERVER_OPTION,
  ]
) {
  return new ChipOption(
    PERMISSIONS_CATALOG_MAP[permission].label,
    icon,
    defaultOptions,
    [...DEFAULT_PERMISSIONS[permission].value],
    onSelectionUpdated
  );
}

@Component({
  selector: 'app-room-configuration-modal',
  templateUrl: './room-configuration-modal.component.html',
  styleUrls: ['./room-configuration-modal.component.scss'],
})
export class RoomConfigurationModalComponent implements OnInit, OnDestroy {
  permissionConfiguration = {
    [RoomPermissionId.CAN_VOTE]: createChipOptionForPermission(
      RoomPermissionId.CAN_VOTE,
      'ballot',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_EDIT_TOPIC]: createChipOptionForPermission(
      RoomPermissionId.CAN_EDIT_TOPIC,
      'edit',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_CREATE_ROUND]: createChipOptionForPermission(
      RoomPermissionId.CAN_CREATE_ROUND,
      'add_circle',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_TAKE_NOTES]: createChipOptionForPermission(
      RoomPermissionId.CAN_TAKE_NOTES,
      'edit_note',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_REVEAL_RESULTS]: createChipOptionForPermission(
      RoomPermissionId.CAN_REVEAL_RESULTS,
      'visibility',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_VIEW_VELOCITY]: createChipOptionForPermission(
      RoomPermissionId.CAN_VIEW_VELOCITY,
      'monitoring',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_DOWNLOAD_RESULTS]: createChipOptionForPermission(
      RoomPermissionId.CAN_DOWNLOAD_RESULTS,
      'download',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_CHANGE_CARD_SETS]: createChipOptionForPermission(
      RoomPermissionId.CAN_CHANGE_CARD_SETS,
      'style',
      () => this.saveRoomConfiguration()
    ),
    [RoomPermissionId.CAN_SET_TIMER]: createChipOptionForPermission(
      RoomPermissionId.CAN_SET_TIMER,
      'schedule',
      () => this.saveRoomConfiguration()
    ),
  };

  permissionForms = Object.values(this.permissionConfiguration);
  roomPassword = new FormControl<string>('', [Validators.minLength(8)]);

  room: Room;

  destroy = new Subject<void>();
  isBusy = new BehaviorSubject<boolean>(false);
  errorMessage = new Subject<string>();

  room$ = this.estimatorService
    .getRoomById(this.dialogData.roomId)
    .pipe(takeUntil(this.destroy), share());

  onConfigurationChanged$: Observable<RoomConfiguration> = this.room$.pipe(
    map((room) => room.configuration),
    distinctUntilChanged(isEqual),
    takeUntil(this.destroy)
  );

  members$: Observable<Member[]> = this.room$.pipe(
    map((room) => [room.members, room.memberIds]),
    distinctUntilChanged(isEqual),
    map(([members, memberIds]) =>
      members
        .filter(
          (m) =>
            (m.status === MemberStatus.ACTIVE || m.status === undefined) &&
            memberIds.includes(m.id)
        )
        .sort((a, b) => a.type?.localeCompare(b.type))
    ),
    share(),
    takeUntil(this.destroy)
  );

  authorizationMetadata$: Observable<AuthorizationMetadata> =
    this.estimatorService
      .getAuthorizationMetadata(this.dialogData.roomId)
      .pipe(takeUntil(this.destroy));

  authorizationMetadata: AuthorizationMetadata | undefined;

  isPasswordSet$: Observable<boolean> = this.estimatorService
    .isPasswordSet(this.dialogData.roomId)
    .pipe(takeUntil(this.destroy));

  organization$: Observable<Organization | undefined> =
    this.organizationService.getMyOrganization();
  organization: Organization | undefined;

  user$ = this.authService.user;
  isPremiumSubscriber$ = this.permissionsService
    .hasPremiumAccess()
    .pipe(takeUntil(this.destroy));

  hasConfigurationAccess$ = combineLatest([
    this.room$,
    this.user$,
    this.isPremiumSubscriber$,
  ]).pipe(
    map(([room, user, isPremium]) => {
      return room.createdById === user.uid && isPremium;
    }),
    share(),
    takeUntil(this.destroy)
  );

  hasConfigurationAccess: boolean = false;

  isLoadingStripe = false;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly permissionsService: PermissionsService,
    private readonly snackbar: MatSnackBar,
    private dialog: MatDialog,
    public readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly paymentService: PaymentService,
    @Inject(MAT_DIALOG_DATA) private dialogData: RoomConfigurationModalData
  ) {}

  ngOnInit() {
    this.room$.subscribe((room) => {
      this.room = room;
    });

    this.authorizationMetadata$.subscribe((meta) => {
      this.authorizationMetadata = meta;
    });

    this.organization$
      .pipe(takeUntil(this.destroy))
      .subscribe((org) => (this.organization = org));

    this.hasConfigurationAccess$.subscribe(
      (access) => (this.hasConfigurationAccess = access)
    );

    this.onConfigurationChanged$.subscribe((roomConfiguration) => {
      if (roomConfiguration) {
        Object.entries(roomConfiguration.permissions).forEach(
          ([permissionId, permissionValue]) => {
            const permissionForm: ChipOption<UserRole> | undefined =
              this.permissionConfiguration[permissionId];
            if (permissionForm) {
              permissionForm.setSelection([...permissionValue.value]);
            }
          }
        );
      }
    });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async saveRoomConfiguration() {
    try {
      this.isBusy.next(true);

      const roomConfiguration: RoomConfiguration =
        this.room.configuration ?? DEFAULT_ROOM_CONFIGURATION;

      // Update permission values
      Object.entries(this.permissionConfiguration).forEach(
        ([permissionId, chipOption]) => {
          const selectedValues = chipOption.selectedValues;
          if (roomConfiguration.permissions[permissionId]) {
            roomConfiguration.permissions[permissionId].value = selectedValues;
          } else {
            roomConfiguration.permissions[permissionId] = {
              permissionId,
              value: selectedValues,
            };
          }
        }
      );

      await this.estimatorService.setConfiguration(
        this.room.roomId,
        roomConfiguration
      );
    } catch (e) {
      console.error(e);
      this.errorMessage.next(e.message);
    } finally {
      this.isBusy.next(false);
    }
  }

  removeMember(member: Member) {
    this.estimatorService.updateMemberStatus(
      this.room.roomId,
      member,
      MemberStatus.REMOVED_FROM_ROOM
    );
  }

  async saveRoomPassword() {
    try {
      await this.estimatorService.setRoomPassword(
        this.room.roomId,
        this.roomPassword.value
      );
      this.showMessage('Password saved!');
      this.roomPassword.reset();
    } catch (e) {
      console.error(e);
    }
  }

  async togglePasswordProtection() {
    this.authorizationMetadata$
      .pipe(
        switchMap((meta) =>
          of(
            this.estimatorService.togglePasswordProtection(
              this.room.roomId,
              !meta?.passwordProtectionEnabled
            )
          )
        ),
        take(1)
      )
      .subscribe();
  }

  async toggleOrganizationProtection() {
    this.authorizationMetadata$
      .pipe(
        switchMap((meta) =>
          of(
            this.estimatorService.toggleOrganizationProtection(
              this.room.roomId,
              !meta?.organizationProtection,
              this.organization.id
            )
          )
        ),
        take(1)
      )
      .subscribe();
  }

  private showMessage(message: string) {
    this.snackbar.open(message, null, {
      duration: 3000,
      horizontalPosition: 'right',
    });
  }

  openOrganizationModal() {
    this.dialog.open(...organizationModalCreator());
  }

  openAuthModal() {
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }

  addToOrganization(memberId: string) {
    this.organizationService.addMember(this.organization.id, memberId);
  }

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    await this.paymentService.startSubscriptionToPremium();
    this.isLoadingStripe = false;
  }

  openLearnMore() {
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
