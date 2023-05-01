import { Inject, Injectable } from '@angular/core';
import {
  addDoc,
  arrayUnion,
  collectionData,
  collectionSnapshots,
  docData,
  Firestore,
  orderBy,
  query,
  where,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
  starWars,
} from 'unique-names-generator';
import { combineLatest, firstValueFrom, from, Observable, of } from 'rxjs';
import { filter, first, map, switchMap, take, tap } from 'rxjs/operators';
import {
  Room,
  Member,
  CardSet,
  Round,
  Notes,
  CardSetValue,
  CustomCardSet,
  MemberStatus,
  Timer,
  RoomConfiguration,
  AuthorizationMetadata,
  SubscriptionMetadata,
  RichTopic,
  RoomSummary,
} from './../types';
import {
  collection,
  CollectionReference,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { DocumentReference } from 'rxfire/firestore/interfaces';
import { AuthService } from './auth.service';
import { createHash } from '../utils';
import { OrganizationService } from './organization.service';
import { PaymentService } from './payment.service';
import { APP_CONFIG, AppConfig } from '../app-config.module';

export class MemberNotFoundError extends Error {}
export class RoomNotFoundError extends Error {}
export class NotLoggedInError extends Error {}

@Injectable({
  providedIn: 'root',
})
export class EstimatorService {
  ROOMS_COLLECTION = 'rooms';
  INVITATIONS_COLLECTION = 'invitations';
  FEEDBACK_COLLECTION = 'feedbacks';

  activeMember: Member;

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private functions: Functions,
    private readonly paymentService: PaymentService,
    private readonly organizationService: OrganizationService,
    @Inject(APP_CONFIG) public readonly config: AppConfig,
  ) {}

  createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  private async signInAsMember(member: Member) {
    let user = await this.authService.getUser();
    let userId = user?.uid;

    if (user && !user?.displayName) {
      try {
        await this.authService.updateDisplayName(user, member.name);
      } catch {
        console.error('Failed to update display name');
      }
    }

    if (!userId) {
      const newUser = await this.authService.loginAnonymously(member.name);
      userId = newUser.uid;
    }

    member.id = userId;
    member.platform = this.config.isRunningInZoom ? 'zoom' : 'web';

    if (user?.photoURL) {
      member.avatarUrl = user.photoURL;
    }
  }

  getRoom(roomId: string): Promise<Room> {
    return firstValueFrom(
      docData<Room>(
        doc(
          this.firestore,
          this.ROOMS_COLLECTION,
          roomId
        ) as DocumentReference<Room>
      ).pipe(
        first(),
        tap((room) => {
          if (!room) {
            throw new RoomNotFoundError();
          }
        })
      )
    );
  }

  async createRoom(
    member: Member,
    recurringMeetingId: string | null
  ): Promise<{ room: Room; member: Member }> {
    await this.signInAsMember(member);

    const customConfig: Config = {
      dictionaries: [adjectives, colors, animals, starWars],
      separator: '-',
      length: 3,
    };

    let roomId = uniqueNamesGenerator(customConfig);

    if (await this.doesRoomAlreadyExist(roomId)) {
      roomId = uniqueNamesGenerator({ ...customConfig, length: 4 });
    }

    const subscriptionMetadata = await this.getSubscriptionMetadata();

    const room: Room = {
      id: this.createId(),
      roomId,
      members: [member],
      rounds: { 0: this.createRound([member], 1) },
      currentRound: 0,
      isOpen: true,
      createdAt: serverTimestamp(),
      cardSet: CardSet.DEFAULT,
      createdById: member.id,
      memberIds: [member.id],
      subscriptionMetadata,
    };

    if (recurringMeetingId) {
      room.relatedRecurringMeetingLinkId = recurringMeetingId;
    }

    await setDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), room);

    this.activeMember = member;

    return { room, member };
  }

  private async getSubscriptionMetadata(): Promise<SubscriptionMetadata> {
    const isPremium = await this.paymentService.isPremiumSubscriber();
    const organization = await firstValueFrom(
      this.organizationService.getMyOrganization()
    );
    const subscriptionMetadata: SubscriptionMetadata = {
      createdWithPlan: isPremium ? 'premium' : 'basic',
      createdWithOrganization: organization ? organization.id : null,
    };

    return subscriptionMetadata;
  }

  async doesRoomAlreadyExist(roomId: string): Promise<boolean> {
    return this.getRoom(roomId)
      .then((room) => !!room)
      .catch(() => false);
  }

  async joinRoom(roomId: string, member: Member) {
    await this.signInAsMember(member);

    const existingRoom = await this.getRoom(roomId);
    const isAlreadyMember = existingRoom.members.find(
      (m) => m.id === member.id
    );

    const updatedMembers = existingRoom.members.filter(
      (m) => m.id !== member.id
    );

    updatedMembers.push(member);

    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: isAlreadyMember ? updatedMembers : arrayUnion(member),
      memberIds: arrayUnion(member.id),
    });

    this.activeMember = member;

    return member;
  }

  async updateMemberStatus(
    roomId: string,
    member: Member,
    status = MemberStatus.LEFT_ROOM
  ) {
    const room = await this.getRoom(roomId);
    const updatedMembers = [...room.members];
    const updatedMember = room.members.find((m) => m.id === member.id);

    updatedMember.status = status;

    await updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      members: updatedMembers,
    });
  }

  getRoomById(roomId: string): Observable<Room> {
    return combineLatest([
      this.authService.user,
      docData<Room>(
        doc(
          this.firestore,
          this.ROOMS_COLLECTION,
          roomId
        ) as DocumentReference<Room>
      ),
    ]).pipe(
      tap(([user, room]) => {
        if (!room) {
          throw new RoomNotFoundError();
        }
        const member = room.members.find((m) => m.id === user?.uid);
        if (!member) {
          throw new MemberNotFoundError();
        }

        this.activeMember = member;
      }),
      map(([_user, room]) => room)
    );
  }

  updateRoom(roomId: string, fields: Partial<Room>) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      ...fields,
    });
  }

  setTopic(
    room: Room,
    round: number,
    topic: string,
    richTopic?: RichTopic | null
  ) {
    const updates: any = {
      [`rounds.${round}.topic`]: topic,
    };

    if (richTopic !== undefined) {
      updates[`rounds.${round}.richTopic`] = richTopic;
    }

    return updateDoc(
      doc(this.firestore, this.ROOMS_COLLECTION, room.roomId),
      updates
    );
  }

  setShowResults(room: Room, round: number, showResults: boolean) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${round}.show_results`]: showResults,
    });
  }

  setTimer(room: Room, timer: Timer) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      timer,
    });
  }

  setConfiguration(roomId: string, configuration: RoomConfiguration) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      configuration,
    });
  }

  private getRoundIds(room: Room) {
    const currentRoundId =
      room.currentRound ?? Object.keys(room.rounds).length - 1;
    const numberOfRounds = Object.keys(room.rounds).length;
    const nextRoundId = numberOfRounds;
    const nextRoundNumber = nextRoundId + 1;

    return { currentRoundId, numberOfRounds, nextRoundId, nextRoundNumber };
  }

  newRound(room: Room) {
    const { currentRoundId, nextRoundId, nextRoundNumber } =
      this.getRoundIds(room);
    room.rounds[currentRoundId].finished_at = serverTimestamp();
    room.rounds[nextRoundId] = this.createRound(room.members, nextRoundNumber);
    return this.updateRoom(room.roomId, {
      rounds: room.rounds,
      currentRound: nextRoundId,
    });
  }

  addRound(room: Room, topic: string, richTopic?: RichTopic) {
    const { nextRoundId, nextRoundNumber } = this.getRoundIds(room);

    room.rounds[nextRoundId] = this.createRound(
      room.members,
      nextRoundNumber,
      topic,
      richTopic
    );
    return this.updateRoom(room.roomId, { rounds: room.rounds });
  }

  setActiveRound(room: Room, roundId: number, shouldRevote: boolean) {
    room.currentRound = roundId;
    if (shouldRevote) {
      const round = room.rounds[roundId];
      room.rounds[roundId] = this.revoteRound(round);
    }
    return this.updateRoom(room.roomId, {
      currentRound: roundId,
      rounds: room.rounds,
    });
  }

  setEstimate(
    room: Room,
    roundNumber: number,
    estimate: number | null,
    userId: string
  ) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${roundNumber}.estimates.${userId}`]: estimate,
    });
  }

  setRoomCardSet(roomId: string, selectedSet: CardSet) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      cardSet: selectedSet,
    });
  }

  toggleShowPassOption(roomId: string, showPassOption: boolean) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      showPassOption,
    });
  }

  createRound(
    members: Member[],
    roundNumber: number,
    topic?: string,
    richTopic?: RichTopic
  ): Round {
    const round: Round = {
      id: this.createId(),
      topic: topic ?? `Topic of Round ${roundNumber}`,
      started_at: serverTimestamp(),
      finished_at: null,
      estimates: {},
      show_results: false,
      notes: {
        note: '',
        editedBy: null,
      },
    };

    if (richTopic) {
      round.richTopic = richTopic;
    }

    return round;
  }

  revoteRound(round: Round): Round {
    return {
      ...round,
      started_at: serverTimestamp(),
      finished_at: null,
      estimates: {},
      show_results: false,
    };
  }

  setNote(note: string, room: Room, member: Member) {
    const newNote: Notes = {
      note,
      editedBy: member || null,
    };
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes`]: newNote,
    });
  }

  setNoteEditor(room: Room, member: Member | null) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      [`rounds.${room.currentRound}.notes.editedBy`]: member || null,
    });
  }

  setRoomCustomCardSetValue(roomId: string, selectedSet: CardSetValue) {
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, roomId), {
      cardSet: CustomCardSet,
      customCardSetValue: selectedSet,
    });
  }

  updateCurrentUserMemberAvatar(room: Room, avatarUrl: string | null) {
    const newMembers = [...room.members];
    const member = newMembers.find((m) => m.id === this.activeMember.id);
    member.avatarUrl = avatarUrl;
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      members: newMembers,
    });
  }

  updateCurrentUserMemberName(room: Room, name: string) {
    const newMembers = [...room.members];
    const member = newMembers.find((m) => m.id === this.activeMember.id);
    member.name = name;
    return updateDoc(doc(this.firestore, this.ROOMS_COLLECTION, room.roomId), {
      members: newMembers,
    });
  }

  saveInvitation(invitationId: string, roomId: string) {
    return setDoc(
      doc(
        this.firestore,
        this.INVITATIONS_COLLECTION,
        createHash(invitationId)
      ),
      {
        roomId,
        invitationId,
        invitedBy: this.activeMember.id || null,
        createdAt: serverTimestamp(),
      }
    );
  }

  getPreviousSessions(): Observable<Room[]> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }
        const ref = collection(
          this.firestore,
          this.ROOMS_COLLECTION
        ) as CollectionReference<Room>;
        const q = query<Room>(
          ref,
          where('memberIds', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
        );

        return collectionSnapshots<Room>(q).pipe(
          filter((snapshots) => !snapshots.some((s) => s.metadata.fromCache)),
          map((snapshots) => snapshots.map((s) => s.data()))
        );
      })
    );
  }

  submitFeedback(rating: number) {
    return from(this.authService.getUser()).pipe(
      take(1),
      switchMap((user) => {
        const userId = user.uid;
        return addDoc(collection(this.firestore, this.FEEDBACK_COLLECTION), {
          userId,
          rating,
          createdAt: serverTimestamp(),
        });
      })
    );
  }

  getRoomSummaries(roomId: string): Observable<RoomSummary[]> {
    const ref = collection(
      this.firestore,
      this.ROOMS_COLLECTION,
      roomId,
      'summaries'
    ) as CollectionReference<RoomSummary>;

    const q = query<RoomSummary>(ref, orderBy('createdAt', 'desc'));

    return collectionData(q);
  }

  generateRoomSummary(roomId: string, csvSummary: string) {
    return httpsCallable(
      this.functions,
      'createSummary'
    )({ csvSummary, roomId });
  }

  async setRoomPassword(roomId: string, password: string) {
    const result = await httpsCallable(
      this.functions,
      'setRoomPassword'
    )({ password, roomId });
    await this.authService.refreshIdToken();
    return result;
  }

  async joinRoomWithPassword(roomId: string, password: string) {
    const result = await httpsCallable(
      this.functions,
      'enterProtectedRoom'
    )({ password, roomId });
    await this.authService.refreshIdToken();
    return result;
  }

  getAuthorizationMetadata(roomId: string): Observable<AuthorizationMetadata> {
    return docData<AuthorizationMetadata>(
      doc(
        this.firestore,
        this.ROOMS_COLLECTION,
        roomId,
        'metadata',
        'authorization'
      ) as DocumentReference<AuthorizationMetadata>
    );
  }

  isPasswordSet(roomId: string): Observable<boolean> {
    return docData<any>(
      doc(
        this.firestore,
        this.ROOMS_COLLECTION,
        roomId,
        'metadata',
        'passwordProtection'
      ) as DocumentReference<any>
    ).pipe(map((data) => !!data?.value));
  }

  async togglePasswordProtection(roomId: string, isEnabled: boolean) {
    const existingMeta = await firstValueFrom(
      this.getAuthorizationMetadata(roomId)
    );

    const meta: AuthorizationMetadata = {
      ...existingMeta,
      passwordProtectionEnabled: isEnabled,
    };
    return setDoc(
      doc(
        this.firestore,
        this.ROOMS_COLLECTION,
        roomId,
        'metadata',
        'authorization'
      ),
      meta
    );
  }

  async toggleOrganizationProtection(
    roomId: string,
    isEnabled: boolean,
    organizationId: string
  ) {
    const existingMeta = await firstValueFrom(
      this.getAuthorizationMetadata(roomId)
    );

    const meta: AuthorizationMetadata = {
      ...existingMeta,
      organizationProtection: isEnabled ? organizationId : null,
    };

    const currentRoom = await this.getRoom(roomId);
    const organization = await firstValueFrom(
      this.organizationService.getOrganization(organizationId)
    );
    const memberIds = currentRoom.memberIds.filter((memberId) =>
      organization.memberIds.includes(memberId)
    );

    await setDoc(
      doc(
        this.firestore,
        this.ROOMS_COLLECTION,
        roomId,
        'metadata',
        'authorization'
      ),
      meta
    );

    // Update room members to be organization-only
    if (isEnabled) {
      await this.updateRoom(roomId, { memberIds });
    }
  }
}
