import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { isEqual } from 'lodash';
import {
  distinctUntilChanged,
  map,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
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
    map((userProfilesMap) => Object.values(userProfilesMap)),
    tap(console.log)
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

  constructor(
    private readonly organizationService: OrganizationService,
    public readonly authService: AuthService,
    private readonly toastService: ToastService,
    private readonly dialog: MatDialog,
    private readonly paymentsService: PaymentService,
    public readonly permissionsService: PermissionsService
  ) {}

  ngOnInit(): void {
    this.organization$.pipe(takeUntil(this.destroy)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async createEmptyOrganization() {
    const user = await this.authService.getUser();
    this.organizationService.createOrganization({
      name: `${user.displayName}'s Organization`,
      logoUrl: null,
    });
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
  }

  async onLogoDropped(file: File) {
    this.toastService.showMessage('Uploading logo...');
    await this.organizationService.updateLogo(file, this.organization.id);
    this.toastService.showMessage('Logo uploaded.');
  }

  async removeLogo() {
    await this.organizationService.updateOrganization(this.organization.id, {
      logoUrl: null,
    });
    this.toastService.showMessage('Logo removed.');
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
    await this.paymentsService.startSubscriptionToPremium();
    this.isLoadingStripe = false;
  }

  openLearnMore() {
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
