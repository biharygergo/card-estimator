import { Component, computed, signal, viewChild } from '@angular/core';
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

interface TeamMember {
  id: string;
  name: string;
  contribution: number;
  daysOffUntilEnd: number;
}

function createTeamMember() {
  return new FormGroup({
    id: new FormControl<string>(Date.now().toString()),
    name: new FormControl<string>(''),
    contribution: new FormControl<number>(100),
    daysOffUntilEnd: new FormControl<number>(0),
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

  const memberDayOffBalance = teamMembers.reduce((balance, member) => {
    balance[member.id] = member.daysOffUntilEnd;
    return balance;
  }, {} as Record<string, number>);

  while (remainingStoryPoints > 0) {
    // Skip weekends (Saturday: 6, Sunday: 0)
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const availableHoursThisDay = teamMembers.length
        ? teamMembers.reduce((sum, member) => {
            if (memberDayOffBalance[member.id] > 0) {
              memberDayOffBalance[member.id]--;
              return sum;
            }
            return sum + (member.contribution / 100) * 8;
          }, 0)
        : 8 * staffing;

      const storyPointsThisDay = Math.min(
        remainingStoryPoints,
        availableHoursThisDay / effectiveStoryPointHours
      );
      dailyBurndown.push({
        date: new Date(currentDate),
        remainingStoryPoints,
        storyPointsCompleted: storyPointsThisDay,
      });
      remainingStoryPoints -= storyPointsThisDay;
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
    ReactiveFormsModule,
    DatePipe,
    BaseChartDirective,
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
    buffer: new FormControl<number>(1, [Validators.required]),
  });
  protected readonly teamMembers = new FormArray([createTeamMember()]);

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

  protected readonly parametersExpander =
    viewChild<MatExpansionPanel>('parametersExpander');
  protected readonly teamMembersExpander = viewChild<MatExpansionPanel>(
    'teamMembersExpander'
  );

  addTeamMember() {
    this.teamMembers.push(createTeamMember());
  }

  removeTeamMember(index: number) {
    this.teamMembers.removeAt(index);
  }

  calculate() {
    if (this.parametersForm.invalid) {
      return;
    }

    this.parametersExpander().close();
    this.teamMembersExpander().close();

    const timelineEstimate = estimateProjectTimeline({
      startDate: this.parametersForm.controls.startDate.value,
      teamMembers: this.teamMembers.value as TeamMember[],
      staffing: this.parametersForm.controls.staffing.value,
      totalStoryPoints: this.parametersForm.controls.storyPoints.value,
      storyPointToDays: this.parametersForm.controls.storyPointToDays.value,
      targetVelocity: this.parametersForm.controls.targetVelocity.value / 100,
      bufferDays: this.parametersForm.controls.buffer.value * 7,
    });

    console.log(timelineEstimate);
    this.result.set(timelineEstimate);
  }

  nextStep() {
    this.parametersExpander().close();
    this.teamMembersExpander().open();
  }
}
