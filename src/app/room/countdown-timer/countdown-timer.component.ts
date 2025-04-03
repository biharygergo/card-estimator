import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  Input,
  OnDestroy,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { serverTimestamp, Timestamp } from '@angular/fire/firestore';
import { isEqual } from 'lodash';
import {
  distinctUntilChanged,
  map,
  Observable,
  Subject,
  takeUntil,
  tap,
} from 'rxjs';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { EstimatorService } from 'src/app/services/estimator.service';
import { PermissionsService } from 'src/app/services/permissions.service';
import { Room, Timer, TimerState } from 'src/app/types';
import { AsyncPipe } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';

const INITIAL_TIMER_STATE = {
  initialCountdownLength: 30,
  countdownLength: 30,
  extraSecondsAdded: 0,
  startedAt: null,
  state: TimerState.INIT,
};

@Component({
  selector: 'countdown-timer',
  templateUrl: './countdown-timer.component.html',
  styleUrls: ['./countdown-timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatProgressBar,
    MatButton,
    MatIcon,
    MatIconButton,
    MatTooltip,
    MatProgressSpinner,
    AsyncPipe,
  ],
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  room = input.required<Observable<Room>>();
  minimized = input.required<boolean>();

  _room = signal<Room | undefined>(undefined);

  timer = signal<Timer | undefined>(undefined);
  durationLeft = signal<number | undefined>(undefined);
  progressValue = signal<number>(100);

  intervalHandle = signal<number | undefined>(undefined);

  isSmallScreen$ = this.breakpointObserver.observe('(max-width: 800px)').pipe(
    map(result => result.matches),
    tap(isSmallScreen => this.isSmallScreen.set(isSmallScreen))
  );
  isSmallScreen = signal<boolean>(false);

  private readonly destroy = new Subject<void>();
  readonly TimerState = TimerState;
  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly analyitics: AnalyticsService,
    public readonly permissionsService: PermissionsService,
    private readonly breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.room()
      .pipe(
        tap(room => {
          this._room.set(room);
        }),
        map(room => room.timer),
        distinctUntilChanged(isEqual),
        takeUntil(this.destroy)
      )
      .subscribe((timer: Timer | undefined) => {
        this.timer.set(timer ?? INITIAL_TIMER_STATE);
        this.durationLeft.set(Math.max(0, this.calculateRemaininingSeconds()));
        if (this.durationLeft() === 0) {
          this.stopTimer(false);
        }

        if (
          this.timer().state === TimerState.ACTIVE &&
          this.timer().startedAt
        ) {
          this.startTimer(false);
        } else if (this.timer().state === TimerState.STOPPED) {
          this.stopTimer(false);
        } else if (this.timer().state === TimerState.INIT) {
          this.resetTimer(false);
        }

        this.calculateProgress();
      });

    this.isSmallScreen$.pipe(takeUntil(this.destroy)).subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  calculateRemaininingSeconds() {
    let remainingSeconds = this.timer().countdownLength;
    if (this.timer().startedAt) {
      const startedAt = (this.timer().startedAt as Timestamp).seconds * 1000;
      remainingSeconds = Math.round(
        (startedAt + this.timer().countdownLength * 1000 - Date.now()) / 1000
      );
    }

    return remainingSeconds;
  }

  updateTimer(timer: Timer) {
    return this.estimatorService.setTimer(this._room(), timer);
  }

  private updateTimerInternal(update: Partial<Timer>) {
    return this.timer.set({ ...this.timer(), ...update });
  }

  addSeconds() {
    this.updateTimerInternal({
      extraSecondsAdded: this.timer().extraSecondsAdded + 30,
      countdownLength: this.timer().countdownLength + 30,
    });
    this.durationLeft.set(this.durationLeft() + 30);

    this.updateTimer(this.timer());
  }

  startTimer(updateOthers: boolean) {
    if (this.timer().state !== TimerState.ACTIVE) {
      this.updateTimerInternal({
        state: TimerState.ACTIVE,
        startedAt: serverTimestamp(),
        countdownLength: this.durationLeft(),
      });

      if (updateOthers) {
        this.updateTimer(this.timer());
        this.analyitics.logClickedStartTimer();
      }
    }

    window.clearInterval(this.intervalHandle());

    this.intervalHandle.set(
      window.setInterval(() => {
        const remaining = this.durationLeft() - 1;
        this.durationLeft.set(Math.max(0, remaining));
        this.calculateProgress();

        if (this.durationLeft() === 0) {
          this.stopTimer(false);
        }
      }, 1000)
    );
  }

  calculateProgress() {
    this.progressValue.set(
      Math.round(
        (this.durationLeft() /
          (this.timer().initialCountdownLength +
            this.timer().extraSecondsAdded)) *
          100
      )
    );
  }

  stopTimer(updateOthers: boolean) {
    window.clearInterval(this.intervalHandle());
    this.updateTimerInternal({
      state: TimerState.STOPPED,
      startedAt: null,
      countdownLength: this.durationLeft(),
    });

    if (updateOthers) {
      this.updateTimer(this.timer());
      this.analyitics.logClickedStopTimer();
    }
  }

  resetTimer(updateOthers: boolean) {
    window.clearInterval(this.intervalHandle());

    if (updateOthers) {
      this.durationLeft.set(this.timer().initialCountdownLength);
      this.updateTimerInternal({
        state: TimerState.INIT,
        startedAt: null,
        countdownLength: this.timer().initialCountdownLength,
        extraSecondsAdded: 0,
      });

      this.calculateProgress();

      this.updateTimer(this.timer());
      this.analyitics.logClickedResetTimer();
    }
  }
}
