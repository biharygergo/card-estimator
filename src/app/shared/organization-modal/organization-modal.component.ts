import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
import { ToastService } from 'src/app/services/toast.service';
import { Organization } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const organizationModalCreator =
  (): ModalCreator<OrganizationModalComponent> => [
    OrganizationModalComponent,
    {
      id: 'organizationModal',
      width: '90%',
      maxWidth: '600px',
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

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.organization$.pipe(takeUntil(this.destroy)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  createEmptyOrganization() {
    this.organizationService.createOrganization({
      name: '',
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
    console.log('inviting', this.invitationEmail.value);
    await this.organizationService.inviteMemberByEmail(
      this.organization.id,
      this.invitationEmail.value
    );

    this.toastService.showMessage(
      `Invitation sent to ${this.invitationEmail.value}`
    );
    this.invitationEmail.reset();
  }
}
