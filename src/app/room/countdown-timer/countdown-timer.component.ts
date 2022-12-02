import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { serverTimestamp } from '@angular/fire/firestore';
import { Timestamp } from 'firebase/firestore';
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
import { Room, Timer, TimerState } from 'src/app/types';

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
  encapsulation: ViewEncapsulation.None,
})
export class CountdownTimerComponent implements OnInit, OnDestroy {
  @Input() room: Observable<Room>;

  _room: Room;

  timer: Timer = INITIAL_TIMER_STATE;
  durationLeft: number = INITIAL_TIMER_STATE.countdownLength;
  progressValue = 100;

  intervalHandle: number | undefined;

  private readonly destroy = new Subject<void>();
  readonly TimerState = TimerState;
  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly analyitics: AnalyticsService
  ) {}

  ngOnInit(): void {
    this.room
      .pipe(
        tap((room) => {
          this._room = room;
        }),
        map((room) => room.timer),
        distinctUntilChanged((prevTimer, currTimer) => {
          return JSON.stringify(prevTimer) === JSON.stringify(currTimer);
        }),
        takeUntil(this.destroy)
      )
      .subscribe((timer: Timer | undefined) => {
        this.timer = timer ?? INITIAL_TIMER_STATE;
        if (timer) {
          this.durationLeft = this.calculateRemaininingSeconds();

          if (this.timer.state === TimerState.ACTIVE && this.timer.startedAt) {
            this.startTimer(false);
          } else if (this.timer.state === TimerState.STOPPED) {
            this.stopTimer(false);
          } else if (this.timer.state === TimerState.INIT) {
            this.resetTimer(false);
          }
        }

        this.calculateProgress();
      });
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  calculateRemaininingSeconds() {
    let remainingSeconds = this.timer.countdownLength;
    if (this.timer.startedAt) {
      const startedAt = (this.timer.startedAt as Timestamp).seconds * 1000;
      remainingSeconds = Math.round(
        (startedAt + this.timer.countdownLength * 1000 - Date.now()) / 1000
      );
    }

    return remainingSeconds;
  }

  updateTimer(timer: Timer) {
    return this.estimatorService.setTimer(this._room, timer);
  }

  addSeconds() {
    this.timer.countdownLength += 30;
    this.timer.extraSecondsAdded += 30;
    this.durationLeft += 30;

    this.updateTimer(this.timer);
  }

  startTimer(updateOthers: boolean) {
    if (this.timer.state !== TimerState.ACTIVE) {
      this.timer.state = TimerState.ACTIVE;
      this.timer.startedAt = serverTimestamp();
      this.timer.countdownLength = this.durationLeft;

      if (updateOthers) {
        this.updateTimer(this.timer);
        this.analyitics.logClickedStartTimer();
      }
    }

    window.clearInterval(this.intervalHandle);

    this.intervalHandle = window.setInterval(() => {
      const remaining = this.durationLeft - 1;
      this.durationLeft = Math.max(0, remaining);
      this.calculateProgress();

      if (this.durationLeft === 0) {
        this.stopTimer(false);
      }
    }, 1000);
  }

  calculateProgress() {
    this.progressValue = Math.round(
      (this.durationLeft /
        (this.timer.initialCountdownLength + this.timer.extraSecondsAdded)) *
        100
    );
  }

  stopTimer(updateOthers: boolean) {
    window.clearInterval(this.intervalHandle);
    this.timer.startedAt = null;
    this.timer.state = TimerState.STOPPED;
    this.timer.countdownLength = this.durationLeft;

    if (updateOthers) {
      this.updateTimer(this.timer);
      this.analyitics.logClickedStopTimer();
    }
  }

  resetTimer(updateOthers: boolean) {
    window.clearInterval(this.intervalHandle);

    if (updateOthers) {
      this.durationLeft = this.timer.initialCountdownLength;
      this.timer.startedAt = null;
      this.timer.countdownLength = this.timer.initialCountdownLength;
      this.timer.extraSecondsAdded = 0;
      this.timer.state = TimerState.INIT;

      this.calculateProgress();

      this.updateTimer(this.timer);
      this.analyitics.logClickedResetTimer();
    }
  }
}
