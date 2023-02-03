import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounceTime, map, Subject, takeUntil } from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { Member, Room } from 'src/app/types';

@Component({
  selector: 'app-notes-field',
  templateUrl: './notes-field.component.html',
  styleUrls: ['./notes-field.component.scss'],
})
export class NotesFieldComponent implements OnInit, OnDestroy {
  _room: Room;
  get room(): Room {
    return this._room;
  }
  @Input() set room(room: Room) {
    this._room = room;
    this.onRoomUpdated(room);
  }

  cachedRound: number;
  noteValue = new FormControl<string>('');
  isNoteDisabled: boolean;
  hasPermission: boolean = true;

  editedBy: Member | null;

  blurTimeout: number | undefined;

  destroy = new Subject<void>();
  constructor(
    private estimatorService: EstimatorService,
    private readonly permissionsService: PermissionsService,
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

    this.permissionsService
      .canTakeNotes()
      .pipe(takeUntil(this.destroy))
      .subscribe((canTakeNotes) => {
        console.log('can take notes', canTakeNotes);
        this.hasPermission = canTakeNotes;
        !canTakeNotes
          ? this.noteValue.disable({ emitEvent: false })
          : this.noteValue.enable({ emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
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
        (this.editedBy && this.editedBy.id !== this.auth.getUid()) ||
        !this.hasPermission;

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
