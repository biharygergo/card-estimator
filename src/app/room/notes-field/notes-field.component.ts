import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  debounceTime,
  map,
  Subject,
  takeUntil,
  combineLatest,
  withLatestFrom,
  first,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { AuthService } from 'src/app/services/auth.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { Member, Room, Round } from 'src/app/types';
import { RoomDataService } from '../room-data.service';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { MatInput } from '@angular/material/input';
import { MatFormField, MatLabel, MatHint } from '@angular/material/form-field';

@Component({
    selector: 'app-notes-field',
    templateUrl: './notes-field.component.html',
    styleUrls: ['./notes-field.component.scss'],
    standalone: true,
    imports: [
        FormsModule,
        MatFormField,
        MatLabel,
        MatInput,
        CdkTextareaAutosize,
        ReactiveFormsModule,
        MatHint,
    ],
})
export class NotesFieldComponent implements OnInit, OnDestroy {
  room: Room;

  cachedRound: number;
  noteValue = new FormControl<string>('');
  isNoteDisabled: boolean;
  hasPermission: boolean = true;

  isCurrentUserEditing = false;
  editedBy: Pick<Member, 'id' | 'name'> | null;

  blurTimeout: number | undefined;

  destroy = new Subject<void>();
  constructor(
    private estimatorService: EstimatorService,
    private readonly permissionsService: PermissionsService,
    private analytics: AnalyticsService,
    private auth: AuthService,
    private readonly roomDataService: RoomDataService
  ) {}

  ngOnInit(): void {
    this.noteValue.valueChanges
      .pipe(
        debounceTime(500),
        takeUntil(this.destroy),
        withLatestFrom(this.roomDataService.currentRoundNumber$)
      )
      .subscribe(([value, currentRound]) => {
        this.estimatorService.setNote(
          value,
          this.room,
          currentRound,
          this.estimatorService.activeMember
        );
      });

    this.permissionsService
      .canTakeNotes()
      .pipe(takeUntil(this.destroy))
      .subscribe((canTakeNotes) => {
        this.hasPermission = canTakeNotes;
        !canTakeNotes
          ? this.noteValue.disable({ emitEvent: false })
          : this.noteValue.enable({ emitEvent: false });
      });

    this.roomDataService.room$
      .pipe(takeUntil(this.destroy))
      .subscribe((room) => {
        this.room = room;
      });

    combineLatest([
      this.roomDataService.activeRound$,
      this.roomDataService.currentRoundNumber$,
    ])
      .pipe(takeUntil(this.destroy))
      .subscribe(([activeRound, currentRound]) => {
        this.onRoomUpdated(activeRound, currentRound);
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  onNoteFocus() {
    this.isCurrentUserEditing = true;

    return this.roomDataService.currentRoundNumber$
      .pipe(first())
      .subscribe((currentRound) => {
        this.estimatorService.setNoteEditor(
          this.room,
          currentRound,
          this.estimatorService.activeMember
        );
        this.analytics.logFocusedNotesField();
      });
  }

  onNoteBlur() {
    (document.activeElement as HTMLTextAreaElement)?.blur();
    clearTimeout(this.blurTimeout);
    this.isCurrentUserEditing = false;

    return this.roomDataService.currentRoundNumber$
      .pipe(first())
      .subscribe((currentRound) => {
        this.blurTimeout = window.setTimeout(() => {
          this.estimatorService.setNoteEditor(this.room, currentRound, null);
        }, 500);
      });
  }

  onRoomUpdated(currentRound: Round, activeRoundNumber: number) {
    if (currentRound) {
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
        this.cachedRound !== activeRoundNumber
      ) {
        this.noteValue.setValue(currentRound.notes?.note || '', {
          emitEvent: false,
        });

        if (this.cachedRound !== activeRoundNumber) {
          this.cachedRound = activeRoundNumber;
        }
      }
    }
  }
}
