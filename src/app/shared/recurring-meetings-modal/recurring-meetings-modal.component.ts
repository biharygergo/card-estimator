import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { RecurringMeetingLinkService } from 'src/app/services/recurring-meeting-link.service';
import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  first,
  throwError,
} from 'rxjs';
import { RecurringMeetingLink } from 'src/app/types';

export const recurringMeetingModalCreator =
  (data: {}): ModalCreator<RecurringMeetingsModalComponent> => [
    RecurringMeetingsModalComponent,
    {
      id: 'recurringMeetingsModal',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      data,
    },
  ];

@Component({
  selector: 'app-recurring-meetings-modal',
  templateUrl: './recurring-meetings-modal.component.html',
  styleUrls: ['./recurring-meetings-modal.component.scss'],
})
export class RecurringMeetingsModalComponent {
  newMeetingForm = new FormGroup({
    name: new FormControl<string>('', {
      validators: [Validators.required],
      nonNullable: true,
    }),
    frequencyDays: new FormControl<number>(7, {
      validators: [Validators.required],
      nonNullable: true,
    }),
  });

  myRecurringMeetingLinks$: Observable<RecurringMeetingLink[]> =
    this.recurringMeetingsService.getMyRecurringMeetingLinks();

  isSavingMeeting = new BehaviorSubject<boolean>(false);
  isInEditMode = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly recurringMeetingsService: RecurringMeetingLinkService
  ) {}

  createRecurringMeeting() {
    this.isSavingMeeting.next(true);
    return this.recurringMeetingsService
      .addRecurringMeeting({
        name: this.newMeetingForm.value.name,
        frequencyDays: this.newMeetingForm.value.frequencyDays,
        isEnabled: true,
        organizationId: 'TODO',
      })
      .pipe(
        first(),
        catchError((e) => {
          this.isSavingMeeting.next(false);
          return throwError(() => e);
        })
      )
      .subscribe(() => {
        this.isSavingMeeting.next(false);
        this.newMeetingForm.reset();
      });
  }
}
