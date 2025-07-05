import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { RecurringMeetingLinkService } from 'src/app/services/recurring-meeting-link.service';
import { AuthService } from 'src/app/services/auth.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  first,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import {
  RecurringMeetingLink,
  RecurringMeetingLinkCreatedRoom,
} from 'src/app/types';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';
import { User } from '@angular/fire/auth';
import { createModal } from '../avatar-selector-modal/avatar-selector-modal.component';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatInput } from '@angular/material/input';
import {
  MatFormField,
  MatLabel,
  MatPrefix,
  MatSuffix,
} from '@angular/material/form-field';
import {
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export const recurringMeetingsModalCreator = () =>
  createModal(RecurringMeetingsModalComponent, {
    id: 'recurringMeetingsModal',
    data: {},
  });

@Component({
  selector: 'app-recurring-meetings-modal',
  templateUrl: './recurring-meetings-modal.component.html',
  styleUrls: ['./recurring-meetings-modal.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatPrefix,
    MatSuffix,
    MatButton,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    MatMenu,
    MatMenuItem,
    MatDialogActions,
    MatDialogClose,
    AsyncPipe,
    DatePipe,
    MatCheckbox,
    MatProgressSpinner,
  ],
})
export class RecurringMeetingsModalComponent implements OnInit, OnDestroy {
  newMeetingForm = new FormGroup({
    name: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    frequencyDays: new FormControl<number>(7, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    allowOthersToCreateRooms: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
  });

  myRecurringMeetingLinks$: Observable<
    {
      link: RecurringMeetingLink;
      createdRooms: RecurringMeetingLinkCreatedRoom[];
      lastRoom: RecurringMeetingLinkCreatedRoom['createdAt'] | undefined;
    }[]
  > = this.recurringMeetingsService.getMyRecurringMeetingLinks().pipe(
    switchMap(meetingLinks => {
      console.log('meetingLinks', meetingLinks);
      if (meetingLinks.length === 0) {
        return of([]);
      }
      return combineLatest(
        meetingLinks.map(link =>
          this.recurringMeetingsService
            .getCreatedRoomsForMeetingLinkId(link.id)
            .pipe(
              map(createdRooms => ({
                link,
                createdRooms,
                lastRoom: createdRooms.length
                  ? createdRooms[0].createdAt
                  : undefined,
              }))
            )
        )
      );
    }),
    tap(() => this.isLoading.next(false))
  );

  user: User | undefined = undefined;

  isSavingMeeting = new BehaviorSubject<boolean>(false);
  isInEditMode = new BehaviorSubject<boolean>(false);
  editedMeetingLink = new BehaviorSubject<RecurringMeetingLink | undefined>(
    undefined
  );
  isLoading = new BehaviorSubject<boolean>(true);

  readonly destroy = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly recurringMeetingsService: RecurringMeetingLinkService,
    private readonly clipboard: Clipboard,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly dialogRef: DialogRef
  ) {}

  ngOnInit() {
    this.authService.user
      .pipe(takeUntil(this.destroy))
      .subscribe(user => (this.user = user));
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  createRecurringMeeting() {
    this.isSavingMeeting.next(true);
    return this.recurringMeetingsService
      .addRecurringMeeting({
        name: this.newMeetingForm.value.name,
        frequencyDays: this.newMeetingForm.value.frequencyDays,
        isEnabled: true,
        allowOthersToCreateRooms:
          this.newMeetingForm.value.allowOthersToCreateRooms,
      })
      .pipe(
        first(),
        catchError(e => {
          this.isSavingMeeting.next(false);
          return throwError(() => e);
        })
      )
      .subscribe(() => {
        this.isSavingMeeting.next(false);
        this.isInEditMode.next(false);
        this.newMeetingForm.reset();
      });
  }

  updateRecurringMeeting() {
    this.isSavingMeeting.next(true);
    return this.recurringMeetingsService
      .updateRecurringMeeting(this.editedMeetingLink.value.id, {
        name: this.newMeetingForm.value.name,
        frequencyDays: this.newMeetingForm.value.frequencyDays,
        allowOthersToCreateRooms:
          this.newMeetingForm.value.allowOthersToCreateRooms,
      })
      .pipe(
        first(),
        catchError(e => {
          this.isSavingMeeting.next(false);
          return throwError(() => e);
        })
      )
      .subscribe(() => {
        this.isSavingMeeting.next(false);
        this.isInEditMode.next(false);
        this.newMeetingForm.reset();
      });
  }

  editMeetingLink(link: RecurringMeetingLink) {
    this.newMeetingForm.setValue({
      name: link.name,
      frequencyDays: link.frequencyDays,
      allowOthersToCreateRooms: link.allowOthersToCreateRooms ?? false,
    });
    this.editedMeetingLink.next(link);
    this.isInEditMode.next(true);
  }

  copyMeetingLinkToClipboard(link: RecurringMeetingLink) {
    this.clipboard.copy(`${window.origin}/recurringMeeting/${link.id}`);
    this.toastService.showMessage('Copied to clipboard');
  }

  redirectToHistory(link: RecurringMeetingLink) {
    this.router.navigate(['recurringMeeting', link.id], {});
    this.dialogRef.close();
  }
}
