import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  CollectionReference,
  Firestore,
  Timestamp,
  collection,
  collectionData,
  deleteDoc,
  doc,
  setDoc,
} from '@angular/fire/firestore';
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
    private firestore: Firestore,
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
              this.firestore,
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
            doc(this.firestore, `userDetails/${user.uid}/cardSets/${id}`)
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
          this.firestore,
          `userDetails/${user.uid}/cardSets`
        ) as CollectionReference<SavedCardSetValue>;
        return collectionData<SavedCardSetValue>(cardSetsCollection);
      })
    );
  }

  private createId() {
    return doc(collection(this.firestore, '_')).id;
  }
}
