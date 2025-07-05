import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { isEqual } from 'lodash-es';
import {
  BehaviorSubject,
  combineLatest,
  delay,
  distinctUntilChanged,
  filter,
  from,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { PaymentService } from 'src/app/services/payment.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ToastService } from 'src/app/services/toast.service';
import { InvitationData, Organization, OrganizationMember, OrganizationRole } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { fadeAnimation } from '../animations';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  MatChipEditedEvent,
  MatChipInputEvent,
  MatChipGrid,
  MatChipRow,
  MatChipRemove,
  MatChipInput,
  MatChipListbox,
  MatChip,
  MatChipSet,
} from '@angular/material/chips';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { FileUploadDragDropComponent } from '../file-upload-drag-drop/file-upload-drag-drop.component';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatHint, MatSuffix } from '@angular/material/form-field';
import { MatTabGroup, MatTab } from '@angular/material/tabs';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { OrganizationSelectorComponent } from '../organization-selector/organization-selector.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressBar } from '@angular/material/progress-bar';
import { pricingModalCreator } from '../pricing-table/pricing-table.component';
import { MatDivider } from '@angular/material/divider';

export const organizationModalCreator =
  (): ModalCreator<OrganizationModalComponent> => [
    OrganizationModalComponent,
    {
      id: 'organizationModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '98vh',
      panelClass: 'custom-dialog',
    },
  ];

interface OrganizationChecklist {
  items: {
    organizationCreated: boolean;
    logoUploaded: boolean;
    colleaguesInvited: boolean;
  };
  allCompleted: boolean;
}

@Component({
  selector: 'app-organization-modal',
  templateUrl: './organization-modal.component.html',
  styleUrls: ['./organization-modal.component.scss'],
  animations: [fadeAnimation],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatCard,
    MatCardContent,
    MatIcon,
    MatButton,
    MatTabGroup,
    MatTab,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatHint,
    FileUploadDragDropComponent,
    MatIconButton,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatChipGrid,
    MatChipRow,
    MatChipRemove,
    MatChipInput,
    MatSuffix,
    MatChipListbox,
    MatChip,
    MatTooltip,
    MatProgressSpinner,
    MatDialogActions,
    MatDialogClose,
    MatProgressBar,
    MatChipSet,
    AsyncPipe,
    OrganizationSelectorComponent,
    MatDivider,
  ],
})
export class OrganizationModalComponent implements OnInit, OnDestroy {
  organization$ = this.organizationService.getMyOrganization().pipe(
    tap(org => (this.organization = org)),
    tap(org => {
      if (org) {
        this.organizationForm.setValue({
          name: org.name,
          logoUrl: org.logoUrl,
        });
      }
    }),
    shareReplay(1)
  );

  members$ = this.organization$.pipe(
    map(org => org?.id),
    distinctUntilChanged(),
    switchMap(organizationId => {
      if (!organizationId) {
        return of([]);
      }
      return this.organizationService.getOrganizationMembers(organizationId);
    }),
    shareReplay(1)
  );

  invitations$ = this.organization$.pipe(
    switchMap(organization => {
      if (!organization || !organization.memberIds?.length) {
        return of({ invitations: [], organization });
      }
      // Add a delay before querying invitations to handle newly created organizations
      return of(null).pipe(
        delay(500), // 500ms delay
        switchMap(() =>
          this.organizationService
            .getInvitations(organization.id)
            .pipe(map(invitations => ({ invitations, organization })))
        )
      );
    }),
    map(({ invitations }) =>
      invitations.filter(invite => invite.status !== 'accepted')
    ),
    map(invitations =>
      invitations.map(invite => ({
        ...invite,
        tooltip: `Invite sent at: ${new Date(
          invite.createdAt?.seconds * 1000
        ).toLocaleString()}`,
      }))
    )
  );

  checklist$: Observable<OrganizationChecklist> = combineLatest([
    this.organization$,
  ]).pipe(
    map(([organization]) => {
      const checklistItems = {
        organizationCreated: true,
        logoUploaded: !!organization?.logoUrl,
        colleaguesInvited: organization?.memberIds.length > 1,
      };
      return {
        items: checklistItems,
        allCompleted: Object.values(checklistItems).every(item => !!item),
      };
    })
  );

  organizations$ = this.organizationService.getMyOrganizations();

  organization: Organization | null | undefined = null;
  showIntro = true;

  destroy = new Subject<void>();

  organizationForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    logoUrl: new FormControl<string>(''),
  });

  invitationEmail = new FormControl<string>('', [
    Validators.required,
    Validators.email,
  ]);
  addOnBlur = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  isAdmin = signal(false);
  emailFormValues: string[] = [];
  readonly inviteProgress = new BehaviorSubject<string>('');

  protected readonly organizationCredits = toSignal(
    combineLatest([
      from(this.paymentsService.getAndAssignCreditBundles()),
      this.organization$.pipe(
        map(org => org?.id),
        filter(orgId => !!orgId),
        distinctUntilChanged()
      ),
    ]).pipe(
      map(([{ credits }, orgId]) => {
        const organizationCredits = credits.filter(
          credit => credit.organizationId === orgId
        );

        const total = organizationCredits.length;
        const available = organizationCredits.filter(
          credit => !credit.usedForRoomId
        ).length;
        const used = total - available;

        return { total, available, used };
      })
    )
  );

  // New properties for role management
  readonly OrganizationRole = OrganizationRole;
  currentUserId$ = this.authService.user.pipe(map(user => user?.uid));

  constructor(
    private readonly organizationService: OrganizationService,
    public readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog,
    public readonly paymentsService: PaymentService,
    public readonly permissionsService: PermissionsService,
    private readonly analytics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.permissionsService.initializePremiumAccess();
    this.organization$.pipe(takeUntil(this.destroy)).subscribe();
    this.organization$
      .pipe(
        switchMap(organization =>
          this.authService.user.pipe(
            map(
              user =>
                user && organization && this.organizationService.isUserAdmin(organization, user.uid)
            )
          )
        ),
        takeUntil(this.destroy)
      )
      .subscribe(
        isAdmin =>
        {
          this.isAdmin.set(isAdmin);
        }
      );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async createEmptyOrganization() {
    const user = await this.authService.getUser();
    let domain = '';

    try {
      const emailDomain = user.email.split('@')[1].split('.')[0];
      if (!['gmail', 'icloud', 'hotmail'].includes(emailDomain)) {
        domain = emailDomain.charAt(0).toUpperCase() + emailDomain.slice(1);
      }
    } catch {
      // No-op
    }

    await this.organizationService.createOrganization({
      name: domain || `${user.displayName}'s Organization`,
      logoUrl: null,
    });
    this.analytics.logClickedGetStartedOrganization();
  }

  async saveOrganization() {
    if (this.organization === undefined) {
      await this.organizationService.createOrganization({
        name: this.organizationForm.controls.name.value,
        logoUrl: this.organizationForm.controls.logoUrl.value,
      });
    } else {
      await this.organizationService.updateOrganization(this.organization.id, {
        name: this.organizationForm.controls.name.value,
        logoUrl: this.organizationForm.controls.logoUrl.value,
      });
      this.toastService.showMessage('Organization updated.');
    }
    this.analytics.logClickedUpdateOrganization();
  }

  async onLogoDropped(file: File) {
    if (!this.isAdmin) {
      return;
    }
    this.toastService.showMessage('Uploading logo...');
    await this.organizationService.updateLogo(file, this.organization.id);
    this.toastService.showMessage('Logo uploaded.');
    this.analytics.logClickedUploadLogo();
  }

  async removeLogo() {
    await this.organizationService.updateOrganization(this.organization.id, {
      logoUrl: null,
    });
    this.toastService.showMessage('Logo removed.');
    this.analytics.logClickedRemoveLogo();
  }

  async inviteMember() {
    let successCount = 0;
    for (let i = 0; i < this.emailFormValues.length; i++) {
      try {
        const email = this.emailFormValues[i];
        this.inviteProgress.next(
          `[${i + 1}/${
            this.emailFormValues.length
          }]: Sending invite to ${email}`
        );
        await this.organizationService.inviteMemberByEmail(
          this.organization.id,
          email
        );
        successCount += 1;
      } catch {
        this.toastService.showMessage(
          'Could not send invitation to: ' + this.emailFormValues[i],
          5000,
          'error'
        );
      }
    }

    this.toastService.showMessage(
      `Invitation sent to ${successCount} colleagues`
    );
    this.emailFormValues = [];
    this.inviteProgress.next('');

    this.analytics.logClickedInviteOrganizationMember();
  }

  async removeFromOrganization(memberId: string) {
    if (!this.organization) return;

    try {
      await this.organizationService.removeMember(this.organization.id, memberId);
      this.toastService.showMessage('Member removed successfully');
    } catch (error: any) {
      this.toastService.showMessage(error.message || 'Failed to remove member', 3000, 'error');
    }
  }

  openCreateAccountModal() {
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }

  removeEmailFromForm(email: string) {
    const index = this.emailFormValues.indexOf(email);

    if (index >= 0) {
      this.emailFormValues.splice(index, 1);
    }
  }

  editEmailInForm(email: string, event: MatChipEditedEvent) {
    const value = event.value.trim();

    if (!value) {
      this.removeEmailFromForm(email);
      return;
    }

    const index = this.emailFormValues.indexOf(email);
    if (index >= 0) {
      this.emailFormValues[index] = value;
    }
  }

  addEmailToForm(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    if (value) {
      const emails: string[] = [
        ...new Set(value.split(',').map(email => email.trim())),
      ];
      this.emailFormValues.push(...emails);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  removeInvite(invite: InvitationData) {
    this.organizationService.removeInvitation(this.organization.id, invite.id);
  }

  purchaseCredits() {
    this.dialog.open(...pricingModalCreator({ selectedTab: 'org-credits' }));
  }

  async updateMemberRole(memberId: string, newRole: OrganizationRole) {
    if (!this.organization) return;

    try {
      await this.organizationService.updateMemberRole(this.organization.id, memberId, newRole);
      this.toastService.showMessage('Member role updated successfully');
    } catch (error: any) {
      this.toastService.showMessage(error.message || 'Failed to update member role', 3000, 'error');
    }
  }

  isUserAdmin(organization: Organization, userId: string): boolean {
    return this.organizationService.isUserAdmin(organization, userId);
  }

  getUserRole(organization: Organization, userId: string): OrganizationRole {
    return this.organizationService.getUserRole(organization, userId);
  }

  canManageMember(organization: Organization, currentUserId: string, targetMemberId: string): boolean {
    if (!this.isUserAdmin(organization, currentUserId)) {
      return false;
    }
    
    // Admins can't remove themselves if they're the last admin
    if (currentUserId === targetMemberId) {
      const memberRoles = organization.memberRoles || {};
      const adminMembers = Object.entries(memberRoles)
        .filter(([_, role]) => role === OrganizationRole.ADMIN)
        .map(([memberId, _]) => memberId);
      
      if (!memberRoles[organization.createdById]) {
        adminMembers.push(organization.createdById);
      }
      
      return adminMembers.length > 1;
    }
    
    return true;
  }

  getRoleDisplayName(role: OrganizationRole): string {
    switch (role) {
      case OrganizationRole.ADMIN:
        return 'Admin';
      case OrganizationRole.MEMBER:
        return 'Member';
      default:
        return 'Member';
    }
  }
}
