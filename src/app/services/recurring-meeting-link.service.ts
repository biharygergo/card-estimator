import { Injectable } from '@angular/core';
import {
  CollectionReference,
  DocumentReference,
  Firestore,
  Timestamp,
  collection,
  collectionData,
  doc,
  orderBy,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, map, first, from } from 'rxjs';
import {
  RecurringMeetingLink,
  RecurringMeetingLinkCreatedRoom,
} from '../types';
import { docData } from 'rxfire/firestore';

@Injectable({
  providedIn: 'root',
})
export class RecurringMeetingLinkService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  exchangeRoomIdForMeetingId(
    recurringMeetingLinkId: string
  ): Observable<string | undefined> {
    return docData<RecurringMeetingLink>(
      doc(
        this.firestore,
        'recurringMeetingLinks',
        recurringMeetingLinkId
      ) as DocumentReference<RecurringMeetingLink>
    ).pipe(
      switchMap((recurringMeetingLink) => {
        if (!recurringMeetingLink || !recurringMeetingLink.isEnabled) {
          return of(undefined);
        }

        const date = new Date();
        date.setDate(date.getDate() - recurringMeetingLink.frequencyDays);

        const ref = collection(
          this.firestore,
          'recurringMeetingLinks',
          recurringMeetingLinkId,
          'createdRooms'
        ) as CollectionReference<RecurringMeetingLinkCreatedRoom>;
        const q = query<RecurringMeetingLinkCreatedRoom>(
          ref,
          where('createdAt', '>=', Timestamp.fromDate(date)),
          orderBy('createdAt', 'desc')
        );

        return collectionData<RecurringMeetingLinkCreatedRoom>(q);
      }),
      map((rooms) => {
        return rooms.length ? rooms[0].roomId : undefined;
      })
    );
  }

  addRecurringMeeting(
    data: Omit<RecurringMeetingLink, 'id' | 'createdById' | 'createdAt'>
  ) {
    return this.authService.user.pipe(
      first(),
      switchMap((user) => {
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
            doc(this.firestore, `recurringMeetingLinks/${recurringMeeting.id}`),
            recurringMeeting
          )
        );
      })
    );
  }

  getMyRecurringMeetingLinks(): Observable<RecurringMeetingLink[]> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }

        const collectionReference = collection(
          this.firestore,
          'recurringMeetingLinks'
        ) as CollectionReference<RecurringMeetingLink>;
        const q = query<RecurringMeetingLink>(
          collectionReference,
          where('createdById', '==', user.uid)
        );

        return collectionData<RecurringMeetingLink>(q);
      })
    );
  }

  createId() {
    return doc(collection(this.firestore, '_')).id;
  }
}
