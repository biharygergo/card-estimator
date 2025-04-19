import { Component, Inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { createModal } from '../avatar-selector-modal/avatar-selector-modal.component';
import { pricingModalCreator } from '../pricing-table/pricing-table.component';

type OutOfCreditsOfferState = 'out-of-credits' | 'almost-out-of-credits';
@Component({
  selector: 'app-out-of-credits-offer-modal',
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './out-of-credits-offer-modal.component.html',
  styleUrl: './out-of-credits-offer-modal.component.scss',
})
export class OutOfCreditsOfferModalComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public dialogData: { state: OutOfCreditsOfferState },
    public dialogRef: MatDialogRef<OutOfCreditsOfferModalComponent>,
    private readonly dialog: MatDialog
  ) {}

  openPricing() {
    this.dialog.open(...pricingModalCreator({}));
  }
}

export const outOfCreditsOfferModalCreator = (state: OutOfCreditsOfferState) =>
  createModal(OutOfCreditsOfferModalComponent, {
    id: 'outOfCreditsOfferModal',
    data: { state },
  });
