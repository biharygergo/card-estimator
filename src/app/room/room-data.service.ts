import { Injectable } from '@angular/core';
import {
  Observable,
  map,
  switchMap,
  filter,
  BehaviorSubject,
  distinctUntilChanged,
  combineLatest,
  withLatestFrom,
  Subscription,
} from 'rxjs';
import {
  CardSet,
  CardSetValue,
  DEFAULT_ROOM_CONFIGURATION,
  Member,
  MemberStatus,
  RichTopic,
  Room,
  Round,
  UserProfileMap,
} from '../types';
import { EstimatorService } from '../services/estimator.service';
import { isEqual } from 'lodash';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoomDataService {
  roomSubject = new BehaviorSubject<Room | undefined>(undefined);
  room$: Observable<Room> = this.roomSubject.pipe(filter((room) => !!room));

  localActiveRound = new BehaviorSubject<number | undefined>(undefined);

  roomRoundNumber$ = this.room$.pipe(
    map((room) => room.currentRound ?? 0),
    distinctUntilChanged()
  );

  currentRoundNumber$: Observable<number> = combineLatest([
    this.room$,
    this.roomRoundNumber$,
    this.localActiveRound,
  ]).pipe(
    map(
      ([room, roomActiveRound, localActiveRound]) =>
        (room.isAsyncVotingEnabled ? localActiveRound : undefined) ??
        roomActiveRound
    ),
    distinctUntilChanged()
  );

  activeRound$: Observable<Round> = combineLatest([
    this.room$,
    this.currentRoundNumber$,
  ]).pipe(
    map(([room, roundNumber]) => room.rounds[roundNumber]),
    distinctUntilChanged(isEqual)
  );

  roomTopic$: Observable<{ topic: string; richTopic?: RichTopic | null }> =
    this.activeRound$.pipe(
      map((activeRound) => {
        return {
          topic: activeRound?.topic || '',
          richTopic: activeRound?.richTopic,
        };
      }),
      distinctUntilChanged(isEqual)
    );

  activeMembers$: Observable<Member[]> = this.room$.pipe(
    map((room) => [room.members, room.memberIds]),
    distinctUntilChanged<[Member[], string[]]>(isEqual),
    map(([members, memberIds]) =>
      members
        .filter(
          (m) =>
            (m.status === MemberStatus.ACTIVE || m.status === undefined) &&
            memberIds.includes(m.id)
        )
        .sort((a, b) => a.type?.localeCompare(b.type))
    )
  );

  activeMember$: Observable<Member> = combineLatest([
    this.room$.pipe(map((room) => room.members)),
    this.authService.user,
  ]).pipe(
    filter(([_members, user]) => !!user),
    map(([members, user]) => members.find((m) => m.id === user.uid)),
    distinctUntilChanged(isEqual)
  );

  userProfiles$: Observable<UserProfileMap> = this.activeMembers$.pipe(
    distinctUntilChanged(isEqual),
    switchMap((members) =>
      this.authService.getUserProfiles(members?.map((m) => m.id) ?? [])
    )
  );

  /* Events */
  onEstimatesUpdated$ = this.activeRound$.pipe(
    map((round) => {
      return round.estimates;
    }),
    distinctUntilChanged(isEqual)
  );

  onCardSetUpdated$: Observable<
    [CardSet | 'CUSTOM', CardSetValue | undefined]
  > = this.room$.pipe(
    map((room) => [room.cardSet, room.customCardSetValue]),
    distinctUntilChanged<[CardSet, CardSetValue]>(isEqual)
  );

  onNameUpdated$: Observable<string> = this.authService.nameUpdated.pipe(
    distinctUntilChanged()
  );

  onPermissionsUpdated$ = this.room$.pipe(
    map((room) => {
      return {
        permissions:
          room.configuration?.permissions ||
          DEFAULT_ROOM_CONFIGURATION.permissions,
      };
    }),
    distinctUntilChanged(isEqual),
    withLatestFrom(this.room$)
  );

  roomSubscription: Subscription;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly authService: AuthService
  ) {}

  loadRoom(roomId: string, startWithRoom?: Room) {
    if (startWithRoom) {
      this.roomSubject.next(startWithRoom);
    }

    this.roomSubscription = this.estimatorService
      .getRoomById(roomId)
      .subscribe((room) => {
        if (this.localActiveRound.value === undefined) {
          this.localActiveRound.next(room.currentRound ?? 0);
        }
        this.roomSubject.next(room);
      });
  }

  leaveRoom() {
    this.roomSubject.next(undefined);
    this.roomSubscription.unsubscribe();
  }
}
