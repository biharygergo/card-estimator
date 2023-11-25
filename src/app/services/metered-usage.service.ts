import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of, switchMap } from 'rxjs';
import { MeteredUsage } from '../types';
import {
  collectionData,
  CollectionReference,
  Firestore,
  collection,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class MeteredUsageService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  getMeteredUsage(
    usageType: 'chatgpt-query',
    period = 'monthly'
  ): Observable<MeteredUsage[]> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user || user.isAnonymous) {
          return of([]);
        }

        const date = new Date();
        const firstDayOfMonth = new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );

        const ref = collection(
          this.firestore,
          'userDetails',
          user.uid,
          'meteredUsage'
        ) as CollectionReference<MeteredUsage>;
        const q = query(
          ref,
          where('type', '==', usageType),
          where('createdAt', '>=', Timestamp.fromDate(firstDayOfMonth))
        );

        return collectionData<MeteredUsage>(q);
      })
    );
  }
}
