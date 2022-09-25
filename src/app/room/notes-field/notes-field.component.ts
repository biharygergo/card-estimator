import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { Member, Room } from 'src/app/types';

@Component({
  selector: 'app-notes-field',
  templateUrl: './notes-field.component.html',
  styleUrls: ['./notes-field.component.scss'],
})
export class NotesFieldComponent implements OnInit {
  _room: Room;
  get room(): Room {
    return this._room;
  }
  @Input() set room(room: Room) {
    this._room = room;
    this.onRoomUpdated(room);
  }

  cachedRound: number;
  noteValue = new FormControl(null);
  isNoteDisabled: boolean;
  editedBy: Member | null;

  blurTimeout: number | undefined;

  constructor(
    private estimatorService: EstimatorService,
    private analytics: AnalyticsService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.noteValue.valueChanges
      .pipe(debounceTime(500))
      .subscribe((value: string) => {
        this.estimatorService.setNote(
          value,
          this.room,
          this.estimatorService.activeMember
        );
      });
  }

  onNoteFocus() {
    this.estimatorService.setNoteEditor(
      this.room,
      this.estimatorService.activeMember
    );
    this.analytics.logFocusedNotesField();
  }

  onNoteBlur() {
    clearTimeout(this.blurTimeout);

    this.blurTimeout = window.setTimeout(() => {
      this.estimatorService.setNoteEditor(this.room, null);
    }, 500);
  }

  onRoomUpdated(room: Room) {
    if (room !== undefined) {
      const currentRound = room.rounds[room.currentRound];

      this.editedBy = currentRound.notes?.editedBy;
      this.isNoteDisabled =
        this.editedBy && this.editedBy.id !== this.auth.getUid();

      this.isNoteDisabled
        ? this.noteValue.disable({ emitEvent: false })
        : this.noteValue.enable({ emitEvent: false });

      if (
        this.isNoteDisabled ||
        this.noteValue.value === null ||
        this.cachedRound !== room.currentRound
      ) {
        this.noteValue.setValue(currentRound.notes?.note || '', {
          emitEvent: false,
        });

        if (this.cachedRound !== room.currentRound) {
          this.cachedRound = room.currentRound;
        }
      }
    }
  }
}
