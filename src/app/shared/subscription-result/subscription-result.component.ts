import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose } from '@angular/material/dialog';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { SubscriptionResult } from 'src/app/types';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MatButton } from '@angular/material/button';

export interface SubscriptionResultModalData {
  result: SubscriptionResult;
}

export const subscriptionResultModalCreator = (
  data: SubscriptionResultModalData
): ModalCreator<SubscriptionResultComponent> => [
  SubscriptionResultComponent,
  {
    id: 'subscriptionResult',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    data,
  },
];

@Component({
    selector: 'app-subscription-result',
    templateUrl: './subscription-result.component.html',
    styleUrls: ['./subscription-result.component.scss'],
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButton,
        MatDialogClose,
    ],
})
export class SubscriptionResultComponent {
  subscriptionResult: SubscriptionResult;

  constructor(
    public dialogRef: MatDialogRef<SubscriptionResultComponent>,
    @Inject(MAT_DIALOG_DATA)
    private readonly dialogData: SubscriptionResultModalData,
    private readonly analytics: AnalyticsService,
  ) {
    this.subscriptionResult = dialogData.result;
    this.analytics.logSubscriptionResultReceived(dialogData.result);
  }

}
