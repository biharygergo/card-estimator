import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map } from 'rxjs';
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
    if (room !== undefined && this.estimatorService.activeMember) {
      const currentRound = room.rounds[room.currentRound];

      this.editedBy = currentRound.notes?.editedBy;
      this.isNoteDisabled =
        this.editedBy !== null &&
        this.editedBy.id !== this.estimatorService.activeMember.id;

      this.isNoteDisabled
        ? this.noteValue.disable({ emitEvent: false })
        : this.noteValue.enable({ emitEvent: false });

      console.log(this.noteValue.value);
      if (this.isNoteDisabled || this.noteValue.value === null) {
        this.noteValue.setValue(currentRound.notes?.note || '', {
          emitEvent: false,
        });
      }
    }
  }

  noteValue = new FormControl(null);
  isNoteDisabled: boolean;
  editedBy: Member | null;

  constructor(private estimatorService: EstimatorService) {}

  ngOnInit(): void {
    this.noteValue.valueChanges
      .pipe(debounceTime(1000))
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
  }

  onNoteBlur() {
    this.estimatorService.setNoteEditor(this.room, null);
  }
}
