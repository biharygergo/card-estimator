import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Route, Router, RouterModule } from '@angular/router';
import { AppConfigModule } from '../app-config.module';
import { SharedModule } from '../shared/shared.module';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import { RecurringMeetingLinkService } from '../services/recurring-meeting-link.service';
import { Observable, Subject, map, of, switchMap, takeUntil } from 'rxjs';
import { EstimatorService } from '../services/estimator.service';

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

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly recurringMeetingLinkService: RecurringMeetingLinkService
  ) {}

  ngOnInit(): void {
    this.recurringMeetingLinkId
      .pipe(
        switchMap((linkId) => {
          return this.recurringMeetingLinkService.exchangeRoomIdForMeetingId(
            linkId
          );
        }),
        switchMap((roomId) => {
          if (!roomId) {
            this.displayErrorMessage();
            return of(undefined);
          }
          console.log('Would redirect to', roomId);

          return of(undefined) //this.router.navigate(['room', roomId]);
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  displayErrorMessage() {
    console.error('Something is not right...');
  }
}
