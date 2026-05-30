import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  CollectionReference,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { collectionData } from '../firebase/firestore-rx';
import { OrganizationService } from './organization.service';
import { CardSetValue, SavedCardSetValue } from '../types';
import {
  Observable,
  combineLatest,
  first,
  from,
  switchMap,
  throwError,
  of,
} from 'rxjs';
import { PermissionsService } from './permissions.service';

export class UnauthorizedError extends Error {
  message = 'User must have a permanent premium account';
}

@Injectable({
  providedIn: 'root',
})
export class CardDeckService {
  constructor(
    private authService: AuthService,
    private readonly permissionsService: PermissionsService,
    private readonly organizationService: OrganizationService
  ) {}

  saveCardDeck(deck: CardSetValue) {
    return combineLatest([
      this.authService.user,
      this.organizationService.getMyOrganization(),
    ]).pipe(
      first(),
      switchMap(async ([user, organization]) => {
        if (!user || user.isAnonymous) {
          return throwError(() => new UnauthorizedError());
        }
        const savedCardSet: SavedCardSetValue = {
          ...deck,
          id: this.createId(),
          createdAt: Timestamp.now(),
          organizationId: organization?.id ?? null,
        };

        return from(
          setDoc(
            doc(
              firestore,
              `userDetails/${user.uid}/cardSets/${savedCardSet.id}`
            ),
            savedCardSet
          )
        );
      })
    );
  }

  deleteCardDeck(id: string) {
    return this.authService.user.pipe(
      first(),
      switchMap(user => {
        if (!user) {
          return throwError(() => new UnauthorizedError());
        }
        return from(
          deleteDoc(
            doc(firestore, `userDetails/${user.uid}/cardSets/${id}`)
          )
        );
      })
    );
  }

  getMyCardDecks(): Observable<SavedCardSetValue[]> {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        const cardSetsCollection = collection(
          firestore,
          `userDetails/${user.uid}/cardSets`
        ) as CollectionReference<SavedCardSetValue>;
        return collectionData<SavedCardSetValue>(cardSetsCollection);
      })
    );
  }

  private createId() {
    return doc(collection(firestore, '_')).id;
  }
}
