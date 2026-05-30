import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  collection,
  doc,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { collectionData, docData } from '../firebase/firestore-rx';
import { AuthService } from './auth.service';
import {
  Observable,
  switchMap,
  of,
  map,
  first,
  from,
  combineLatest,
  catchError,
} from 'rxjs';
import {
  RecurringMeetingLink,
  RecurringMeetingLinkCreatedRoom,
  Room,
} from '../types';
import { OrganizationService } from './organization.service';

@Injectable({
  providedIn: 'root',
})
export class RecurringMeetingLinkService {
  constructor(
    private authService: AuthService,
    private readonly organizationService: OrganizationService
  ) {}

  getRecurringMeeting(
    recurringMeetingLinkId: string
  ): Observable<RecurringMeetingLink> {
    return docData<RecurringMeetingLink>(
      doc(
        firestore,
        'recurringMeetingLinks',
        recurringMeetingLinkId
      ) as DocumentReference<RecurringMeetingLink>
    );
  }

  getCreatedRoomsForMeetingLinkId(
    recurringMeetingLinkId: string
  ): Observable<RecurringMeetingLinkCreatedRoom[]> {
    return this.getRecurringMeeting(recurringMeetingLinkId).pipe(
      switchMap(recurringMeetingLink => {
        if (!recurringMeetingLink || !recurringMeetingLink.isEnabled) {
          return of(undefined);
        }

        const date = new Date();
        date.setDate(date.getDate() - recurringMeetingLink.frequencyDays);

        const ref = collection(
          firestore,
          'recurringMeetingLinks',
          recurringMeetingLinkId,
          'createdRooms'
        ) as CollectionReference<RecurringMeetingLinkCreatedRoom>;
        const q = query(
          ref,
          where('createdAt', '>=', Timestamp.fromDate(date)),
          orderBy('createdAt', 'desc')
        );

        return collectionData<RecurringMeetingLinkCreatedRoom>(q);
      })
    );
  }

  exchangeRoomIdForMeetingId(
    recurringMeetingLinkId: string
  ): Observable<string | undefined> {
    return this.getCreatedRoomsForMeetingLinkId(recurringMeetingLinkId).pipe(
      map(rooms => {
        return rooms.length ? rooms[0].roomId : undefined;
      })
    );
  }

  addRecurringMeeting(
    data: Omit<
      RecurringMeetingLink,
      'id' | 'createdById' | 'createdAt' | 'organizationId'
    >
  ) {
    return combineLatest([this.authService.user]).pipe(
      first(),
      switchMap(([user]) => {
        if (!user) {
          return of(undefined);
        }

        const recurringMeeting: RecurringMeetingLink = {
          ...data,
          createdById: user.uid,
          createdAt: Timestamp.now(),
          id: this.createId(),
        };

        return from(
          setDoc(
            doc(firestore, `recurringMeetingLinks/${recurringMeeting.id}`),
            recurringMeeting
          )
        );
      })
    );
  }

  updateRecurringMeeting(linkId: string, data: Partial<RecurringMeetingLink>) {
    return from(
      updateDoc(doc(firestore, `recurringMeetingLinks/${linkId}`), data)
    );
  }

  getMyRecurringMeetingLinks(): Observable<RecurringMeetingLink[]> {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }

        const collectionReference = collection(
          firestore,
          'recurringMeetingLinks'
        ) as CollectionReference<RecurringMeetingLink>;
        const q = query(
          collectionReference,
          where('createdById', '==', user.uid)
        );

        return collectionData<RecurringMeetingLink>(q);
      })
    );
  }

  getMyOrganizationsRecurringMeetingLinks(): Observable<
    RecurringMeetingLink[]
  > {
    return this.organizationService.getMyOrganization().pipe(
      switchMap(organization => {
        if (!organization) {
          return of([]);
        }

        const collectionReference = collection(
          firestore,
          'recurringMeetingLinks'
        ) as CollectionReference<RecurringMeetingLink>;
        const q = query(
          collectionReference,
          where('organizationId', '==', organization.id)
        );

        return collectionData<RecurringMeetingLink>(q);
      }),
      catchError(e => {
        console.log('got error loading links', e);
        return of([]);
      })
    );
  }

  createId() {
    return doc(collection(firestore, '_')).id;
  }
}
