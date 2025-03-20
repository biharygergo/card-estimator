import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { AnalyticsService } from './../../services/analytics.service';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';

export type AloneInRoomData = {
  name: string;
  onCopyLink: () => void;
};

@Component({
    selector: 'app-alone-in-room-modal',
    templateUrl: './alone-in-room-modal.component.html',
    styleUrls: ['./alone-in-room-modal.component.scss'],
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButton,
        MatIcon,
    ]
})
export class AloneInRoomModalComponent {
  constructor(
    public dialogRef: MatDialogRef<AloneInRoomModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AloneInRoomData,
    private analytics: AnalyticsService
  ) {}

  onExploreClick(): void {
    this.analytics.logClickedContinueAlone();
    this.dialogRef.close();
  }

  onCopyLink() {
    this.analytics.logClickedShareRoom('alone_modal');
    this.data.onCopyLink();
    this.dialogRef.close();
  }
}
