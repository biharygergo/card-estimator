import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { AppConfigModule } from '../app-config.module';
import { SharedModule } from '../shared/shared.module';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import { RecurringMeetingLinkService } from '../services/recurring-meeting-link.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { EstimatorService } from '../services/estimator.service';
import { AuthService } from '../services/auth.service';
import { RecurringMeetingLink } from '../types';

@Component({
  selector: 'app-recurring-meeting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ZoomAppBannerComponent,
    AppConfigModule,
  ],
  templateUrl: './recurring-meeting.component.html',
  styleUrls: ['./recurring-meeting.component.scss'],
})
export class RecurringMeetingComponent implements OnInit, OnDestroy {
  recurringMeetingLinkId: Observable<string> = this.route.paramMap.pipe(
    map((params) => params.get('linkId'))
  );

  private readonly destroy = new Subject<void>();

  readonly roomId$ = this.recurringMeetingLinkId.pipe(
    switchMap((linkId) => {
      if (!linkId) {
        return of(undefined);
      }

      return this.recurringMeetingLinkService.exchangeRoomIdForMeetingId(
        linkId
      );
    })
  );

  readonly meetingLink$: Observable<RecurringMeetingLink> =
    this.recurringMeetingLinkId.pipe(
      switchMap((linkId) => {
        return this.recurringMeetingLinkService.getRecurringMeeting(linkId);
      })
    );

  readonly state$ = combineLatest([
    this.roomId$,
    this.meetingLink$,
    this.authService.user,
  ]).pipe(
    map(([roomId, meetingLink, user]) => {
      const userState =
        meetingLink.createdById === user.uid ? 'creator' : 'member';
      return { roomId, userState, meetingLink };
    }),
    tap(console.log),
    catchError((e) => {
      console.error( e);
      this.hasError.next(true);
      return of(undefined);
    })
  );

  hasError = new BehaviorSubject(false);

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly recurringMeetingLinkService: RecurringMeetingLinkService,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  displayErrorMessage() {
    console.error('Something is not right...');
  }
}
