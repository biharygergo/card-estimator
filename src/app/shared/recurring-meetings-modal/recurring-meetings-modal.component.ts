import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { RecurringMeetingLinkService } from 'src/app/services/recurring-meeting-link.service';
import { AuthService } from 'src/app/services/auth.service';
import { OrganizationService } from 'src/app/services/organization.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  first,
  map,
  switchMap,
  takeUntil,
  tap,
  throwError,
} from 'rxjs';
import {
  Organization,
  RecurringMeetingLink,
  RecurringMeetingLinkCreatedRoom,
} from 'src/app/types';
import { Clipboard } from '@angular/cdk/clipboard';
import { ToastService } from 'src/app/services/toast.service';
import { Router } from '@angular/router';
import { DialogRef } from '@angular/cdk/dialog';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-recurring-meetings-modal',
  templateUrl: './recurring-meetings-modal.component.html',
  styleUrls: ['./recurring-meetings-modal.component.scss'],
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
  });

  myRecurringMeetingLinks$: Observable<
    {
      link: RecurringMeetingLink;
      createdRooms: RecurringMeetingLinkCreatedRoom[];
      lastRoom: RecurringMeetingLinkCreatedRoom['createdAt'] | undefined;
    }[]
  > = this.recurringMeetingsService
    .getMyOrganizationsRecurringMeetingLinks()
    .pipe(
      switchMap((meetingLinks) => {
        return combineLatest(
          meetingLinks.map((link) =>
            this.recurringMeetingsService
              .getCreatedRoomsForMeetingLinkId(link.id)
              .pipe(
                map((createdRooms) => ({
                  link,
                  createdRooms,
                  lastRoom: createdRooms.length
                    ? createdRooms[0].createdAt
                    : undefined,
                }))
              )
          )
        );
      })
    );

  myOrganization$: Observable<Organization | undefined> =
    this.organizationService.getMyOrganization();

  user: User | undefined = undefined;

  isSavingMeeting = new BehaviorSubject<boolean>(false);
  isInEditMode = new BehaviorSubject<boolean>(false);
  editedMeetingLink = new BehaviorSubject<RecurringMeetingLink | undefined>(
    undefined
  );

  readonly destroy = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly organizationService: OrganizationService,
    private readonly recurringMeetingsService: RecurringMeetingLinkService,
    private readonly clipboard: Clipboard,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly dialogRef: DialogRef
  ) {}

  ngOnInit() {
    this.authService.user
      .pipe(takeUntil(this.destroy))
      .subscribe((user) => (this.user = user));
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
        this.isInEditMode.next(false);
        this.newMeetingForm.reset();
      });
  }

  editMeetingLink(link: RecurringMeetingLink) {
    this.newMeetingForm.setValue({
      name: link.name,
      frequencyDays: link.frequencyDays,
    });
    this.editedMeetingLink.next(link);
    this.isInEditMode.next(true);
  }

  copyMeetingLinkToClipboard(link: RecurringMeetingLink) {
    this.clipboard.copy(`${window.origin}/recurringMeeting/${link.id}`);
    this.toastService.showMessage('Copied to clipboard');
  }

  redirectToHistory(link: RecurringMeetingLink) {
    this.router.navigate(['recurringMeeting', link.id], {
      queryParamsHandling: 'preserve',
    });
    this.dialogRef.close();
  }
}
