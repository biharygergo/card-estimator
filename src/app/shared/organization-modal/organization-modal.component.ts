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
    map(userProfilesMap => Object.values(userProfilesMap)),
    tap(console.log),
  );

  organization: Organization | null | undefined = null;

  destroy = new Subject<void>();

  organizationForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    logoUrl: new FormControl<string>(''),
  });

  constructor(
    private readonly organizationService: OrganizationService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.organization$.pipe(takeUntil(this.destroy)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  saveOrganization() {
    if (this.organization === undefined) {
      this.organizationService.createOrganization({
        name: this.organizationForm.controls.name.value,
        logoUrl: this.organizationForm.controls.logoUrl.value,
      });
    } else {
      this.organizationService.updateOrganization({
        name: this.organizationForm.controls.name.value,
        logoUrl: this.organizationForm.controls.logoUrl.value,
      });
    }
  }
}
