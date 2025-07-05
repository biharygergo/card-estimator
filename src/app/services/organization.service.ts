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
  collectionSnapshots,
  deleteDoc,
} from '@angular/fire/firestore';
import { InvitationData, Organization, OrganizationMember, OrganizationRole } from '../types';
import {
  map,
  Observable,
  switchMap,
  of,
  distinctUntilChanged,
  combineLatest,
} from 'rxjs';
import { FileUploadService } from './file-upload.service';
import { PaymentService } from './payment.service';
import { Functions, httpsCallable } from '@angular/fire/functions';

const ORGANIZATION_COLLECTION = 'organizations';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private readonly paymentService: PaymentService,
    private functions: Functions
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
      memberRoles: { [user.uid]: OrganizationRole.ADMIN },
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
    const q = query(collectionReference);

    return collectionSnapshots<InvitationData>(q).pipe(
      map(snapshots => {
        return snapshots.flatMap(snapshot => ({
          ...snapshot.data(),
          id: snapshot.id,
        }));
      })
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

  removeInvitation(organizationId: string, invitationId: string) {
    deleteDoc(
      doc(
        this.firestore,
        ORGANIZATION_COLLECTION,
        organizationId,
        'memberInvitations',
        invitationId
      )
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
    const removeMemberFunction = httpsCallable(this.functions, 'removeOrganizationMember');
    await removeMemberFunction({ organizationId, memberId });
  }

  getOrganizationMembers(organizationId: string): Observable<OrganizationMember[]> {
    const getMembersFunction = httpsCallable(this.functions, 'getOrganizationMembers');
    return new Observable(observer => {
      getMembersFunction({ organizationId }).then((result: any) => {
        observer.next(result.data);
        observer.complete();
      }).catch(error => {
        observer.error(error);
      });
    });
  }

  async updateMemberRole(organizationId: string, memberId: string, newRole: OrganizationRole): Promise<void> {
    const updateRoleFunction = httpsCallable(this.functions, 'updateOrganizationMemberRole');
    await updateRoleFunction({ organizationId, memberId, newRole });
  }

  isUserAdmin(organization: Organization, userId: string): boolean {
    const memberRoles = organization.memberRoles || {};
    return memberRoles[userId] === OrganizationRole.ADMIN || organization.createdById === userId;
  }

  getUserRole(organization: Organization, userId: string): OrganizationRole {
    const memberRoles = organization.memberRoles || {};
    return memberRoles[userId] || (organization.createdById === userId ? OrganizationRole.ADMIN : OrganizationRole.MEMBER);
  }

  getMyOrganizations(): Observable<Organization[]> {
    const ref = collection(
      this.firestore,
      ORGANIZATION_COLLECTION
    ) as CollectionReference<Organization>;

    return this.authService.user.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        const q = query(ref, where('memberIds', 'array-contains', user.uid));

        return collectionData<Organization>(q).pipe();
      })
    );
  }

  getMyOrganization(): Observable<Organization | undefined> {
    return combineLatest([
      this.authService.getUserPreference().pipe(
        map(pref => pref?.activeOrganizationId),
        distinctUntilChanged()
      ),
      this.getMyOrganizations(),
    ]).pipe(
      map(([activeOrgId, orgs]) => {
        const selectedOrg = orgs.find(org => org.id === activeOrgId);
        return selectedOrg ?? orgs?.[0];
      })
    );
  }

  setSelectedOrganization(orgId: string) {
    this.authService
      .updateUserPreference({ activeOrganizationId: orgId })
      .subscribe();
  }
}
