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
  CollectionReference,
  collectionData,
  serverTimestamp,
  addDoc,
} from '@angular/fire/firestore';
import { InvitationData, Organization } from '../types';
import { map, Observable, switchMap, of } from 'rxjs';
import { FileUploadService } from './file-upload.service';
import { PaymentService } from './payment.service';

const ORGANIZATION_COLLECTION = 'organizations';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private readonly paymentService: PaymentService
  ) {}

  private createId() {
    return doc(collection(this.firestore, '_')).id;
  }

  async createOrganization(
    organizationDto: Pick<Organization, 'name' | 'logoUrl'>
  ): Promise<void> {
    const user = await this.authService.getUser();
    const isPremium = await this.paymentService.isPremiumSubscriber();

    const organization: Organization = {
      ...organizationDto,
      id: this.createId(),
      createdById: user.uid,
      memberIds: [user.uid],
      createdAt: serverTimestamp(),
      activePlan: isPremium ? 'premium' : 'basic',
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

  getInvitations(organizationId): Observable<InvitationData[]> {
    const collectionReference = collection(
      this.firestore,
      ORGANIZATION_COLLECTION,
      organizationId,
      'memberInvitations'
    ) as CollectionReference<InvitationData>;
    const q = query<InvitationData>(collectionReference);

    return collectionData<InvitationData>(q);
  }

  async inviteMemberByEmail(organizationId: string, email: string) {
    const user = await this.authService.getUser();

    const invitation: InvitationData = {
      createdAt: serverTimestamp(),
      invitationEmail: email,
      organizationId,
      emailStatus: 'pending',
      invitedById: user.uid,
      status: 'pending',
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
      switchMap((user) => {
        if (!user) {
          return of(undefined);
        }
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
