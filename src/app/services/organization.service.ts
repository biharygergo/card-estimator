import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import {
  addDoc,
  arrayUnion,
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  DocumentReference,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../firebase/firebase';
import { collectionSnapshots, docData } from '../firebase/firestore-rx';
import {
  InvitationData,
  Organization,
  OrganizationMember,
  OrganizationRole,
} from '../types';
import {
  combineLatest,
  defer,
  distinctUntilChanged,
  from,
  map,
  mergeMap,
  Observable,
  of,
  retryWhen,
  switchMap,
  throwError,
  timer,
} from 'rxjs';
import { FileUploadService } from './file-upload.service';
import { PaymentService } from './payment.service';

const ORGANIZATION_COLLECTION = 'organizations';

@Injectable({
  providedIn: 'root',
})
export class OrganizationService {
  constructor(
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private readonly paymentService: PaymentService
  ) {}

  private createId() {
    return doc(collection(firestore, '_')).id;
  }

  async createOrganization(
    organizationDto: Pick<Organization, 'name' | 'logoUrl'>
  ): Promise<string> {
    const user = await this.authService.getUser();
    if (!user) {
      throw new Error('Not signed in');
    }

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

    const orgRef = doc(
      firestore,
      ORGANIZATION_COLLECTION,
      organization.id
    );

    await setDoc(orgRef, organization);
    return organization.id;
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
      doc(firestore, ORGANIZATION_COLLECTION, organizationId),
      organization
    );
  }

  getOrganization(organizationId: string): Observable<Organization> {
    return docData<Organization>(
      doc(
        firestore,
        ORGANIZATION_COLLECTION,
        organizationId
      ) as DocumentReference<Organization>
    );
  }

  getInvitations(organizationId): Observable<InvitationData[]> {
    const collectionReference = collection(
      firestore,
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
        firestore,
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
        firestore,
        ORGANIZATION_COLLECTION,
        organizationId,
        'memberInvitations',
        invitationId
      )
    );
  }

  async addMember(organizationId: string, memberId: string) {
    await updateDoc(doc(firestore, ORGANIZATION_COLLECTION, organizationId), {
      memberIds: arrayUnion(memberId),
    });
  }

  async removeMember(organizationId: string, memberId: string) {
    const removeMemberFunction = httpsCallable(functions, 'removeOrganizationMember');
    await removeMemberFunction({ organizationId, memberId });
  }

  getOrganizationMembers(organizationId: string): Observable<OrganizationMember[]> {
    const getMembersFunction = httpsCallable(functions, 'getOrganizationMembers');
    return defer(() =>
      from(getMembersFunction({ organizationId }) as Promise<{ data: OrganizationMember[] }>)
    ).pipe(
      map(result => result.data),
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, attemptIndex) => {
            const code = (error as { code?: string })?.code ?? '';
            const transient =
              code === 'functions/not-found' ||
              code === 'functions/permission-denied' ||
              code === 'not-found' ||
              code === 'permission-denied';
            if (transient && attemptIndex < 5) {
              return timer(280 + attemptIndex * 200);
            }
            return throwError(() => error);
          })
        )
      )
    );
  }

  async updateMemberRole(organizationId: string, memberId: string, newRole: OrganizationRole): Promise<void> {
    const updateRoleFunction = httpsCallable(functions, 'updateOrganizationMemberRole');
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
      firestore,
      ORGANIZATION_COLLECTION
    ) as CollectionReference<Organization>;

    return this.authService.user.pipe(
      switchMap(user => {
        if (!user) {
          return of([]);
        }
        const q = query(ref, where('memberIds', 'array-contains', user.uid));

        return collectionSnapshots(q).pipe(
          map(snapshots =>
            snapshots.map(
              doc =>
                ({
                  ...doc.data(),
                  id: doc.id,
                }) as Organization
            )
          )
        );
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
        const selectedOrg = activeOrgId
          ? orgs.find(org => org.id === activeOrgId)
          : undefined;
        return selectedOrg ?? orgs?.[0];
      })
    );
  }

  setSelectedOrganization(orgId: string) {
    this.authService
      .updateUserPreference({ activeOrganizationId: orgId })
      .subscribe({ error: () => {} });
  }
}
