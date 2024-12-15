import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatOptionModule,
  provideNativeDateAdapter,
} from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import 'chartjs-adapter-date-fns';
import {
  MatAccordion,
  MatExpansionModule,
  MatExpansionPanel,
} from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatChipsModule } from '@angular/material/chips';
import { distinctUntilChanged } from 'rxjs';
import { add } from 'lodash';
import { CarbonAdComponent } from 'src/app/shared/carbon-ad/carbon-ad.component';

interface TeamMember {
  id: string;
  name: string;
  contribution: number;
  daysOffUntilEnd: number;
  daysOff: Date[];
}

function createTeamMember(member?: TeamMember) {
  return new FormGroup({
    id: new FormControl<string>(member?.id || Date.now().toString()),
    name: new FormControl<string>(member?.name || ''),
    contribution: new FormControl<number>(member?.contribution || 100),
    daysOffUntilEnd: new FormControl<number>(member?.daysOffUntilEnd || 0),
    daysOff: new FormArray(
      member?.daysOff?.map((day) => new FormControl<Date>(day)) ?? []
    ),
  });
}

interface DailyBurndownData {
  date: Date;
  storyPointsCompleted: number;
  remainingStoryPoints: number;
}

interface TimelineEstimate {
  estimatedEndDateFromStoryPoints: Date;
  totalDaysFromStoryPoints: number;
  actualEndDate: Date;
  actualDaysFromCapacity: number;
  dailyBurndown: DailyBurndownData[];
}

function addWeekdays(startDate: Date, daysToAdd: number): Date {
  let currentDate = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < daysToAdd) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      daysAdded++;
    }
  }
  return new Date(currentDate);
}

function findNearestAvailableWeekday(
  takenDates: Date[],
  startDate: Date
): Date {
  let currentDate = new Date(startDate);
  while (
    takenDates.some(
      (takenDate) => takenDate.getTime() === currentDate.getTime()
    ) ||
    currentDate.getDay() === 0 ||
    currentDate.getDay() === 6
  ) {
    currentDate = addWeekdays(currentDate, 1);
  }
  return currentDate;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function estimateProjectTimeline(config: {
  startDate: Date;
  teamMembers: TeamMember[];
  staffing: number;
  totalStoryPoints: number;
  storyPointToDays: number;
  targetVelocity: number;
  bufferDays: number;
}): TimelineEstimate {
  const {
    startDate,
    teamMembers,
    totalStoryPoints,
    storyPointToDays,
    targetVelocity,
    bufferDays,
    staffing,
  } = config;
  // The actual number of days it takes to complete a story point
  const effectiveStoryPointDays = storyPointToDays / targetVelocity;
  // The actual number of hours it takes to complete a story point
  const effectiveStoryPointHours = effectiveStoryPointDays * 8;
  // The estimated number of days it takes to complete all story points
  const estimatedDaysFromStoryPoints = Math.ceil(
    totalStoryPoints * effectiveStoryPointDays
  );

  const totalDaysFromStoryPoints =
    estimatedDaysFromStoryPoints / staffing + bufferDays;
  // The estimated end date based on the story points excluding weekends
  const estimatedEndDateFromStoryPoints = addWeekdays(
    startDate,
    totalDaysFromStoryPoints
  );

  let remainingStoryPoints = totalStoryPoints;
  const dailyBurndown: DailyBurndownData[] = [];
  let currentDate = new Date(startDate);
  let actualDaysFromCapacity = 0;

  while (remainingStoryPoints > 0) {
    // Skip weekends (Saturday: 6, Sunday: 0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const availableHoursThisDay = teamMembers.length
        ? teamMembers.reduce((sum, member) => {
            if (
              member.daysOff.some((dayOff) =>
                isSameDay(new Date(dayOff), currentDate)
              )
            ) {
              return sum;
            }
            return sum + (member.contribution / 100) * 8;
          }, 0)
        : 8 * staffing;

      const storyPointsThisDay = Math.min(
        remainingStoryPoints,
        availableHoursThisDay / effectiveStoryPointHours
      );
      remainingStoryPoints -= storyPointsThisDay;
      dailyBurndown.push({
        date: new Date(currentDate),
        remainingStoryPoints,
        storyPointsCompleted: storyPointsThisDay,
      });
      actualDaysFromCapacity++;
    } else {
      dailyBurndown.push({
        date: new Date(currentDate),
        remainingStoryPoints,
        storyPointsCompleted: 0,
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  let remainingBufferDays = bufferDays;
  while (remainingBufferDays > 0) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dailyBurndown.push({
        date: new Date(currentDate),
        remainingStoryPoints,
        storyPointsCompleted: 0,
      });
      remainingBufferDays--;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const actualEndDate = addWeekdays(
    startDate,
    actualDaysFromCapacity + bufferDays
  );

  return {
    estimatedEndDateFromStoryPoints,
    totalDaysFromStoryPoints,
    actualEndDate,
    actualDaysFromCapacity: actualDaysFromCapacity + bufferDays,
    dailyBurndown,
  };
}

@Component({
  selector: 'app-story-point-calculator',
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
    MatChipsModule,
    ReactiveFormsModule,
    DatePipe,
    BaseChartDirective,
    RouterLink,
    CarbonAdComponent,
  ],
  providers: [
    provideNativeDateAdapter(),
    provideCharts(withDefaultRegisterables()),
  ],
  templateUrl: './story-point-calculator.component.html',
  styleUrl: './story-point-calculator.component.scss',
})
export class StoryPointCalculatorComponent {
  protected readonly parametersForm = new FormGroup({
    storyPoints: new FormControl<number>(0, [Validators.required]),
    startDate: new FormControl<Date>(new Date(), [Validators.required]),
    storyPointToDays: new FormControl<number>(1, [Validators.required]),
    targetVelocity: new FormControl<number>(80, [Validators.required]),
    staffing: new FormControl<number>(1, [Validators.required]),
    bufferDays: new FormControl<number>(5, [Validators.required]),
    teamMembers: new FormArray([createTeamMember()]),
  });

  protected readonly result = signal<TimelineEstimate | undefined>(undefined);
  protected readonly lineChartData = computed<ChartConfiguration['data']>(
    () => {
      if (!this.result()) {
        return { datasets: [] };
      }

      return {
        datasets: [
          {
            label: 'Story points remaining',
            data: this.result().dailyBurndown.map(
              (data) => data.remainingStoryPoints
            ),
          },
        ],
        labels: this.result().dailyBurndown.map((data) =>
          data.date.toISOString()
        ),
      };
    }
  );
  protected readonly lineChartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
        },
      },
    },
  };

  protected readonly howToExpander = viewChild<MatExpansionPanel>('howToExpander');
  protected readonly parametersExpander =
    viewChild<MatExpansionPanel>('parametersExpander');
  protected readonly teamMembersExpander = viewChild<MatExpansionPanel>(
    'teamMembersExpander'
  );

  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit() {
    const formState =
      this.activatedRoute.snapshot.queryParamMap.get('formState');
    if (formState) {
      const { teamMembers, ...otherValues } = JSON.parse(formState);
      this.parametersForm.patchValue(otherValues);
      this.parametersForm.setControl(
        'teamMembers',
        new FormArray(
          (teamMembers as TeamMember[]).map((member) =>
            createTeamMember(member)
          )
        )
      );
      this.teamMembersExpander().open();
    }

    this.parametersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formState) => {
        const queryParams = new URLSearchParams(window.location.search);
        queryParams.set('formState', JSON.stringify(formState));
        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
      });

    this.parametersForm.controls.teamMembers.valueChanges
      .pipe(
        distinctUntilChanged(
          (prev, curr) =>
            prev.map((m) => m.daysOffUntilEnd).join(',') ===
            curr.map((m) => m.daysOffUntilEnd).join(',')
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((teamMembers) => {
        teamMembers.forEach((member, index) => {
          const daysOff = member.daysOffUntilEnd;
          const daysOffArray =
            this.parametersForm.controls.teamMembers.at(index).controls.daysOff;
          let lastAddedDay = this.parametersForm.value.startDate ?? new Date();
          if (daysOffArray.length < daysOff) {
            for (let i = daysOffArray.length; i < daysOff; i++) {
              daysOffArray.push(
                new FormControl<Date>(
                  findNearestAvailableWeekday(member.daysOff, lastAddedDay)
                )
              );
            }
          } else {
            for (let i = daysOffArray.length; i > daysOff; i--) {
              daysOffArray.removeAt(i - 1);
            }
          }
        });
      });
  }

  addTeamMember() {
    this.parametersForm.controls.teamMembers.push(createTeamMember());
  }

  removeTeamMember(index: number) {
    this.parametersForm.controls.teamMembers.removeAt(index);
  }

  calculate() {
    if (this.parametersForm.invalid) {
      return;
    }

    const timelineEstimate = estimateProjectTimeline({
      startDate: this.parametersForm.controls.startDate.value,
      teamMembers: this.parametersForm.controls.teamMembers
        .value as TeamMember[],
      staffing: this.parametersForm.controls.staffing.value,
      totalStoryPoints: this.parametersForm.controls.storyPoints.value,
      storyPointToDays: this.parametersForm.controls.storyPointToDays.value,
      targetVelocity: this.parametersForm.controls.targetVelocity.value / 100,
      bufferDays: this.parametersForm.controls.bufferDays.value,
    });

    this.result.set(timelineEstimate);

    this.howToExpander().close();
    this.parametersExpander().close();
    this.teamMembersExpander().close();
    document.querySelector('.calculator').scrollIntoView();
  }

  nextStep() {
    this.howToExpander().close();
    this.parametersExpander().close();
    this.teamMembersExpander().open();
    document.querySelector('.calculator').scrollIntoView();
  }
}
