import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import {
  DEFAULT_ROOM_CONFIGURATION,
  MemberType,
  Room,
  RoomPermissionId,
  UserPermissions,
  UserRole,
} from '../types';
import { PaymentService } from './payment.service';

@Injectable()
export class PermissionsService {
  userPermissions = new BehaviorSubject<Partial<UserPermissions>>({});
  isPremiumSubscriber = new BehaviorSubject<boolean | null>(null);

  constructor(private readonly paymentsService: PaymentService) {}

  initializePermissions(room: Room, userId: string) {
    const permissions = {
      ...DEFAULT_ROOM_CONFIGURATION.permissions,
      ...(room.configuration?.permissions || {}),
    };

    let userRoles: UserRole[] = [];
    if (room.createdById === userId) {
      userRoles.push(UserRole.ROOM_CREATOR);
    }

    if (
      room.members
        .filter((m) => m.type === MemberType.ESTIMATOR)
        .map((m) => m.id)
        .includes(userId)
    ) {
      userRoles.push(UserRole.ROOM_MEMBER_ESTIMATOR);
    } else {
      userRoles.push(UserRole.ROOM_MEMBER_OBSERVER);
    }

    const newPermissions = { ...this.userPermissions.value };
    Object.entries(permissions).forEach(([permissionId, permissionValue]) => {
      newPermissions[permissionId] = !!permissionValue.value.filter((role) =>
        userRoles.includes(role)
      ).length;
    });

    this.userPermissions.next(newPermissions);

    this.initializePremiumAccess();
  }

  initializePremiumAccess() {
    this.paymentsService
      .isPremiumSubscriber()
      .then((isPremium) => this.isPremiumSubscriber.next(isPremium));
  }

  hasPermission(permissionId: RoomPermissionId): Observable<boolean> {
    return this.userPermissions.pipe(
      map((permissions) => !!permissions[permissionId])
    );
  }

  canCreateRounds(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_CREATE_ROUND);
  }

  canVote(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_VOTE);
  }

  canRevealResults(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_REVEAL_RESULTS);
  }

  canTakeNotes(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_TAKE_NOTES);
  }

  canEditTopic(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_EDIT_TOPIC);
  }

  canDownloadResults(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_DOWNLOAD_RESULTS);
  }

  canViewVelocity(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_VIEW_VELOCITY);
  }

  canChangeCardSet(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_CHANGE_CARD_SETS);
  }

  canSetTimer(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_SET_TIMER);
  }

  canOverrideMajorityVote(): Observable<boolean> {
    return this.hasPermission(RoomPermissionId.CAN_OVERRIDE_MAJORITY_VOTE);
  }

  hasPremiumAccess(): Observable<boolean> {
    return this.isPremiumSubscriber;
  }
}
