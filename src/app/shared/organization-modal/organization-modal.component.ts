import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { isEqual } from 'lodash-es';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import { PaymentService } from 'src/app/services/payment.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { ToastService } from 'src/app/services/toast.service';
import { Organization } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { RecurringMeetingLinkService } from 'src/app/services/recurring-meeting-link.service';
import { fadeAnimation } from '../animations';

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
    recurringMeetingCreated: boolean;
  };
  allCompleted: boolean;
}

@Component({
  selector: 'app-organization-modal',
  templateUrl: './organization-modal.component.html',
  styleUrls: ['./organization-modal.component.scss'],
  animations: [fadeAnimation],
})
export class OrganizationModalComponent implements OnInit, OnDestroy {
  organization$ = this.organizationService.getMyOrganization().pipe(
    tap((org) => (this.organization = org)),
    tap((org) => {
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
    map((organization) => organization.memberIds),
    distinctUntilChanged(isEqual),
    switchMap((memberIds) => this.authService.getUserProfiles(memberIds)),
    map((userProfilesMap) =>
      Object.values(userProfilesMap).filter((profile) => !!profile)
    )
  );

  invitations$ = this.organization$.pipe(
    switchMap((organization) => {
      if (!organization) {
        return of([]);
      }
       return this.organizationService.getInvitations(organization.id);
    }),
    map((invitations) =>
      invitations.filter((invite) => invite.status !== 'accepted')
    ),
  );

  checklist$: Observable<OrganizationChecklist> = combineLatest([
    this.organization$,
    this.recurringMeetingsService.getMyOrganizationsRecurringMeetingLinks(),
  ]).pipe(
    map(([organization, meetings]) => {
      const checklistItems = {
        organizationCreated: true,
        logoUploaded: !!organization?.logoUrl,
        colleaguesInvited: organization?.memberIds.length > 1,
        recurringMeetingCreated: meetings.length > 0,
      };
      return {
        items: checklistItems,
        allCompleted: Object.values(checklistItems).every((item) => !!item),
      };
    })
  );

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

  isOrganizationCreator = false;

  constructor(
    private readonly organizationService: OrganizationService,
    public readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog,
    public readonly paymentsService: PaymentService,
    public readonly permissionsService: PermissionsService,
    private readonly analytics: AnalyticsService,
    private readonly recurringMeetingsService: RecurringMeetingLinkService
  ) {}

  ngOnInit(): void {
    this.permissionsService.initializePremiumAccess();
    this.organization$.pipe(takeUntil(this.destroy)).subscribe();
    this.organization$
      .pipe(
        switchMap((organization) =>
          this.authService.user.pipe(
            map(
              (user) =>
                user && organization && user.uid === organization.createdById
            )
          )
        ),
        takeUntil(this.destroy)
      )
      .subscribe(
        (isOrganizationCreator) =>
          (this.isOrganizationCreator = isOrganizationCreator)
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

    this.organizationService.createOrganization({
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
    if (!this.isOrganizationCreator) {
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
    await this.organizationService.inviteMemberByEmail(
      this.organization.id,
      this.invitationEmail.value
    );

    this.toastService.showMessage(
      `Invitation sent to ${this.invitationEmail.value}`
    );
    this.invitationEmail.reset();
    this.analytics.logClickedInviteOrganizationMember();
  }

  async removeFromOrganization(memberId: string) {
    await this.organizationService.removeMember(this.organization.id, memberId);
    this.toastService.showMessage('Member removed!');
  }

  openCreateAccountModal() {
    this.dialog.open(
      ...signUpOrLoginDialogCreator({
        intent: SignUpOrLoginIntent.LINK_ACCOUNT,
      })
    );
  }
}
