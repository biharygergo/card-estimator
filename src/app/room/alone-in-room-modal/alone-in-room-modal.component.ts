import { Component, Inject } from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

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
    @Inject(MAT_DIALOG_DATA) public data: AloneInRoomData
  ) {}

  onExploreClick(): void {
    this.dialogRef.close();
  }

}
