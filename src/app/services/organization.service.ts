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
  addDoc,
} from '@angular/fire/firestore';
import { InvitationData, Organization } from '../types';
import { filter, map, mapTo, Observable, switchMap } from 'rxjs';
import { FileUploadService } from './file-upload.service';

const ORGANIZATION_COLLECTION = 'organizations';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private fileUploadService: FileUploadService
  ) {}

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

  async updateLogo(file: File, organizationId: string) {
    const downloadUrl = await this.fileUploadService.uploadFile(
      `organizations/${organizationId}/logos/logo-${Date.now()}`,
      file
    );
    return this.updateOrganization(organizationId, {
      logoUrl: downloadUrl,
    });
  }

  async updateOrganization(
    organizationId: string,
    organization: Partial<Organization>
  ): Promise<void> {
    await updateDoc(
      doc(this.firestore, ORGANIZATION_COLLECTION, organizationId),
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

  async inviteMemberByEmail(organizationId: string, email: string) {
    const user = await this.authService.getUser();

    const invitation: InvitationData = {
      createdAt: serverTimestamp(),
      invitationEmail: email,
      organizationId,
      emailStatus: 'pending',
      invitedById: user.uid,
    };

    await addDoc(
      collection(
        this.firestore,
        ORGANIZATION_COLLECTION,
        organizationId,
        'memberInvitations'
      ),
      invitation
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
