import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AppConfigModule } from '../app-config.module';
import { SharedModule } from '../shared/shared.module';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import { RecurringMeetingLinkService } from '../services/recurring-meeting-link.service';
import {
  Observable,
  Subject,
  catchError,
  combineLatest,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RecurringMeetingLink } from '../types';

type State = {
  roomId?: string;
  userState?: string;
  meetingLink?: RecurringMeetingLink;
  error: boolean;
};

@Component({
  selector: 'app-recurring-meeting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ZoomAppBannerComponent,
    AppConfigModule
],
  templateUrl: './recurring-meeting.component.html',
  styleUrls: ['./recurring-meeting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly state$: Observable<State> = combineLatest([
    this.roomId$,
    this.meetingLink$,
    this.authService.user,
  ]).pipe(
    map(([roomId, meetingLink, user]) => {
      const userState =
        meetingLink.createdById === user?.uid ? 'creator' : 'member';
      return { roomId, userState, meetingLink, error: false };
    }),
    catchError((e) => {
      console.error(e);
      return of({ error: true });
    }),
    takeUntil(this.destroy)
  );

  state: State | undefined = undefined;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly recurringMeetingLinkService: RecurringMeetingLinkService,
    private readonly authService: AuthService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.state$.subscribe((state) => {
      this.state = state;
      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }
}
