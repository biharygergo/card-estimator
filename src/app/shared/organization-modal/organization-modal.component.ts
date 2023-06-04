import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { isEqual } from 'lodash-es';
import {
  distinctUntilChanged,
  map,
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
import { premiumLearnMoreModalCreator } from '../premium-learn-more/premium-learn-more.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../sign-up-or-login-dialog/sign-up-or-login-dialog.component';

export const organizationModalCreator =
  (): ModalCreator<OrganizationModalComponent> => [
    OrganizationModalComponent,
    {
      id: 'organizationModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
    },
  ];

@Component({
  selector: 'app-organization-modal',
  templateUrl: './organization-modal.component.html',
  styleUrls: ['./organization-modal.component.scss'],
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
    })
  );

  members$ = this.organization$.pipe(
    map((organization) => organization.memberIds),
    distinctUntilChanged(isEqual),
    switchMap((memberIds) => this.authService.getUserProfiles(memberIds)),
    map((userProfilesMap) =>
      Object.values(userProfilesMap).filter((profile) => !!profile)
    )
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

  isLoadingStripe = false;
  isOrganizationCreator = false;

  constructor(
    private readonly organizationService: OrganizationService,
    public readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog,
    private readonly paymentsService: PaymentService,
    public readonly permissionsService: PermissionsService,
    private readonly analytics: AnalyticsService
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
      name: domain ?? `${user.displayName}'s Organization`,
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

  async subscribeToPremium() {
    this.isLoadingStripe = true;
    this.analytics.logClickedSubscribeToPremium('organization_modal');
    await this.paymentsService.startSubscriptionToPremium();
  }

  openLearnMore() {
    this.analytics.logClickedLearnMorePremium('organization_modal');
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
