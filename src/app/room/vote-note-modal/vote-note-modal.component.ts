import { Component, Inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { EstimatorService } from 'src/app/services/estimator.service';
import { Room } from 'src/app/types';

export interface VoteNoteModalData {
  room: Room;
  roundNumber: number;
  userId: string;
  currentNote: string;
  canEdit: boolean;
}

export const NOTE_MAX_LENGTH = 500;

const VOTE_NOTE_MODAL = 'vote-note';

export const voteNoteModalCreator = (
  data: VoteNoteModalData
): ModalCreator<VoteNoteModalComponent> => [
  VoteNoteModalComponent,
  {
    id: VOTE_NOTE_MODAL,
    width: '90%',
    maxWidth: '440px',
    maxHeight: '98vh',
    panelClass: 'custom-dialog',
    autoFocus: 'textarea',
    data,
  },
];

@Component({
  selector: 'app-vote-note-modal',
  templateUrl: './vote-note-modal.component.html',
  styleUrls: ['./vote-note-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormField,
    MatLabel,
    MatHint,
    MatInput,
    CdkTextareaAutosize,
    FormsModule,
    MatIcon,
    MatButton,
  ],
})
export class VoteNoteModalComponent {
  readonly maxLength = NOTE_MAX_LENGTH;
  note = signal('');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: VoteNoteModalData,
    private readonly dialogRef: MatDialogRef<VoteNoteModalComponent>,
    private readonly estimatorService: EstimatorService
  ) {
    this.note.set(data.currentNote ?? '');
  }

  save() {
    this.estimatorService.setEstimateNote(
      this.data.room,
      this.data.roundNumber,
      this.note(),
      this.data.userId
    );
    this.dialogRef.close();
  }
}
