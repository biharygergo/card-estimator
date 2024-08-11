import { AsyncPipe } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { skip, skipWhile, take } from 'rxjs';
import { OrganizationService } from 'src/app/services/organization.service';

@Component({
  selector: 'planning-poker-organization-selector',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './organization-selector.component.html',
  styleUrl: './organization-selector.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OrganizationSelectorComponent,
    },
  ],
})
export class OrganizationSelectorComponent
  implements OnInit, ControlValueAccessor
{
  label = input.required<string>();
  hint = input<string>();

  private organizationService = inject(OrganizationService);
  private destroyRef = inject(DestroyRef);

  selectedOrganizationId = new FormControl<string>('', { nonNullable: true });
  organizations$ = this.organizationService.getMyOrganizations();

  onChange?: (orgId: string) => {};
  onTouched?: () => {};

  ngOnInit() {
    this.selectedOrganizationId.valueChanges
      .pipe(
        skipWhile((val) => val === ''),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((orgId) => {
        this.organizationService.setSelectedOrganization(orgId);
        this.onChange?.(orgId);
      });

    this.organizationService
      .getMyOrganization()
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((org) => {
        this.selectedOrganizationId.setValue(org?.id ?? '');
      });
  }

  writeValue(orgId: string): void {
    this.selectedOrganizationId.setValue(orgId);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectedOrganizationId.disable();
    } else {
      this.selectedOrganizationId.enable();
    }
  }
}
