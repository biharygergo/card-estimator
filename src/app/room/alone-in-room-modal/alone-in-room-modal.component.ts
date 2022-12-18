import { Component, Inject } from '@angular/core';
import { MatLegacyDialogRef as MatDialogRef, MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA } from '@angular/material/legacy-dialog';
import { AnalyticsService } from './../../services/analytics.service';

export type AloneInRoomData = {
  name: string;
  onCopyLink: () => void;
};

@Component({
  selector: 'app-alone-in-room-modal',
  templateUrl: './alone-in-room-modal.component.html',
  styleUrls: ['./alone-in-room-modal.component.scss'],
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
  }
}
