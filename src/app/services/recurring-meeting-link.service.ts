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
  where,
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, switchMap, of, map } from 'rxjs';
import { MeteredUsage, RecurringMeetingLink, Room } from '../types';
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
          'rooms'
        ) as CollectionReference<Room>;
        const q = query<Room>(
          ref,
          where('relatedRecurringMeetingLinkId', '==', recurringMeetingLinkId),
          where('createdAt', '>=', Timestamp.fromDate(date)),
          orderBy('createdAt', 'desc')
        );

        return collectionData<Room>(q);
      }),
      map((rooms) => {
        return rooms.length ? rooms[0].roomId : undefined;
      })
    );
  }
}
