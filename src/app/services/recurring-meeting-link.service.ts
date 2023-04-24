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

        console.log(recurringMeetingLinkId, date);
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
}
