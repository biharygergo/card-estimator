import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';
import { OrganizationService } from 'src/app/services/organization.service';
import { Organization } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const organizationModalCreator = (): ModalCreator<OrganizationModalComponent> => [
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
  organization: Organization | null | undefined = null;

  destroy = new Subject<void>();

  organizationForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required]),
    logoUrl: new FormControl<string>(''),
  });

  constructor(private readonly organizationService: OrganizationService) {}

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
