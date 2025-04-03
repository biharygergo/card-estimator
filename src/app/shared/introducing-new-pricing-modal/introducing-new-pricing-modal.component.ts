import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';

export const introducingNewPricingModalCreator =
  (): ModalCreator<IntroducingNewPricingModalComponent> => [
    IntroducingNewPricingModalComponent,
    {
      id: 'introducingNewPricingModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '98vh',
      panelClass: 'custom-dialog',
    },
  ];

@Component({
  selector: 'app-introducing-new-pricing-modal',
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './introducing-new-pricing-modal.component.html',
  styleUrl: './introducing-new-pricing-modal.component.scss',
})
export class IntroducingNewPricingModalComponent {}
