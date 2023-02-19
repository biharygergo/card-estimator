import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
  DocumentReference,
  query,
  where,
  orderBy,
  CollectionReference,
  collectionData,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Organization } from '../types';
import { filter, map, mapTo, Observable, switchMap } from 'rxjs';

const ORGANIZATION_COLLECTION = 'organizations';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(private firestore: Firestore, private authService: AuthService) {}

  private createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  async createOrganization(
    organizationDto: Pick<Organization, 'name' | 'logoUrl'>
  ): Promise<void> {
    const user = await this.authService.getUser();
  
    const organization: Organization = {
      ...organizationDto,
      id: this.createId(),
      createdById: user.uid,
      memberIds: [user.uid],
      createdAt: serverTimestamp(),
    };

    await setDoc(
      doc(this.firestore, ORGANIZATION_COLLECTION, organization.id),
      organization
    );
  }

  async updateOrganization(organization: Partial<Organization>): Promise<void> {
    await updateDoc(
      doc(this.firestore, ORGANIZATION_COLLECTION, organization.id),
      organization
    );
  }

  getOrganization(organizationId: string): Observable<Organization> {
    return docData<Organization>(
      doc(
        this.firestore,
        ORGANIZATION_COLLECTION,
        organizationId
      ) as DocumentReference<Organization>
    );
  }

  async addMember(organizationId: string, memberId: string) {
    await updateDoc(
      doc(this.firestore, ORGANIZATION_COLLECTION, organizationId),
      {
        memberIds: arrayUnion(memberId),
      }
    );
  }

  async removeMember(organizationId: string, memberId: string) {
    await updateDoc(
      doc(this.firestore, ORGANIZATION_COLLECTION, organizationId),
      {
        memberIds: arrayRemove(memberId),
      }
    );
  }

  getMyOrganization(): Observable<Organization | undefined> {
    const ref = collection(
      this.firestore,
      ORGANIZATION_COLLECTION
    ) as CollectionReference<Organization>;

    return this.authService.user.pipe(
      filter((user) => !!user),
      switchMap((user) => {
        const q = query<Organization>(
          ref,
          where('memberIds', 'array-contains', user.uid)
        );

        return collectionData<Organization>(q).pipe(
          map((orgs) => (orgs.length ? orgs[0] : undefined))
        );
      })
    );
  }
}
