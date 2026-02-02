import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { PageHeaderComponent } from '../../components/page-header/page-header.component';
import { CarbonAdComponent } from '../../../shared/carbon-ad/carbon-ad.component';

interface MeetingCostResult {
  totalCost: number;
  costPerMinute: number;
  costPerAttendee: number;
  annualCost: number | null;
}

interface CostComparison {
  icon: string;
  value: string;
  label: string;
}

type FrequencyType = 'once' | 'weekly' | 'monthly';

@Component({
  selector: 'app-meeting-cost-calculator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    RouterLink,
    PageHeaderComponent,
    CarbonAdComponent,
  ],
  templateUrl: './meeting-cost-calculator.component.html',
  styleUrls: ['./meeting-cost-calculator.component.scss'],
})
export class MeetingCostCalculatorComponent implements OnInit {
  meetingForm = new FormGroup({
    attendees: new FormControl<number>(5, [
      Validators.required,
      Validators.min(1),
      Validators.max(1000),
    ]),
    avgHourlyRate: new FormControl<number>(75, [
      Validators.required,
      Validators.min(0),
      Validators.max(100000),
    ]),
    duration: new FormControl<number>(60, [
      Validators.required,
      Validators.min(1),
      Validators.max(480),
    ]),
    frequency: new FormControl<FrequencyType>('weekly', [Validators.required]),
  });

  frequencyOptions = [
    { value: 'once', label: 'One-time meeting' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  result = signal<MeetingCostResult | null>(null);

  comparisons = computed(() => {
    const res = this.result();
    if (!res) return [];
    return this.calculateComparisons(res.totalCost);
  });

  insights = computed(() => {
    const res = this.result();
    if (!res) return [];
    const formValue = this.meetingForm.value;
    return this.generateInsights(
      formValue.attendees || 0,
      formValue.duration || 0,
      res.totalCost,
      res.annualCost
    );
  });

  constructor() {
    // Recalculate whenever form changes
    effect(() => {
      if (this.meetingForm.valid) {
        this.calculate();
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to form changes for real-time updates
    this.meetingForm.valueChanges.subscribe(() => {
      if (this.meetingForm.valid) {
        this.calculate();
      }
    });

    // Initial calculation
    if (this.meetingForm.valid) {
      this.calculate();
    }
  }

  private calculate(): void {
    const { attendees, avgHourlyRate, duration, frequency } =
      this.meetingForm.value;

    if (
      attendees == null ||
      avgHourlyRate == null ||
      duration == null ||
      frequency == null
    ) {
      return;
    }

    // Calculate total meeting cost
    const totalCost = (avgHourlyRate * attendees * duration) / 60;

    // Calculate cost per minute
    const costPerMinute = totalCost / duration;

    // Calculate cost per attendee
    const costPerAttendee = totalCost / attendees;

    // Calculate annual cost based on frequency
    let annualCost: number | null = null;
    if (frequency === 'weekly') {
      annualCost = totalCost * 52; // 52 weeks per year
    } else if (frequency === 'monthly') {
      annualCost = totalCost * 12; // 12 months per year
    }

    this.result.set({
      totalCost: Math.round(totalCost * 100) / 100,
      costPerMinute: Math.round(costPerMinute * 100) / 100,
      costPerAttendee: Math.round(costPerAttendee * 100) / 100,
      annualCost: annualCost ? Math.round(annualCost * 100) / 100 : null,
    });
  }

  private calculateComparisons(totalCost: number): CostComparison[] {
    const comparisons: CostComparison[] = [];

    // Starbucks lattes ($5 each)
    const lattes = Math.floor(totalCost / 5);
    if (lattes >= 1) {
      comparisons.push({
        icon: 'local_cafe',
        value: lattes.toString(),
        label: lattes === 1 ? 'Starbucks latte' : 'Starbucks lattes',
      });
    }

    // Developer hours ($75/hr average)
    const devHours = Math.round((totalCost / 75) * 10) / 10;
    if (devHours >= 0.1) {
      comparisons.push({
        icon: 'computer',
        value: devHours.toFixed(1),
        label: devHours === 1 ? 'hour of dev time' : 'hours of dev time',
      });
    }

    // Technical books ($40 each)
    const books = Math.floor(totalCost / 40);
    if (books >= 1) {
      comparisons.push({
        icon: 'menu_book',
        value: books.toString(),
        label: books === 1 ? 'technical book' : 'technical books',
      });
    }

    // Netflix months ($15/month)
    const netflixMonths = Math.floor(totalCost / 15);
    if (netflixMonths >= 1) {
      comparisons.push({
        icon: 'tv',
        value: netflixMonths.toString(),
        label: netflixMonths === 1 ? 'month of Netflix' : 'months of Netflix',
      });
    }

    // Team pizzas ($30 each)
    const pizzas = Math.floor(totalCost / 30);
    if (pizzas >= 1) {
      comparisons.push({
        icon: 'local_pizza',
        value: pizzas.toString(),
        label: pizzas === 1 ? 'team pizza' : 'team pizzas',
      });
    }

    // GitHub Copilot subscriptions ($10/month)
    const copilotMonths = Math.floor(totalCost / 10);
    if (copilotMonths >= 1) {
      comparisons.push({
        icon: 'code',
        value: copilotMonths.toString(),
        label:
          copilotMonths === 1
            ? 'month of GitHub Copilot'
            : 'months of GitHub Copilot',
      });
    }

    // Return top 6 comparisons or all if less than 6
    return comparisons.slice(0, 6);
  }

  private generateInsights(
    attendees: number,
    duration: number,
    totalCost: number,
    annualCost: number | null
  ): string[] {
    const insights: string[] = [];

    // Meeting duration insights
    if (duration > 60) {
      const shorterDuration = 45;
      const savings = ((duration - shorterDuration) / 60) * attendees * 75;
      insights.push(
        `This meeting is ${duration} minutes long. Consider breaking it into shorter sessions—reducing to ${shorterDuration} minutes could save $${Math.round(savings)} per meeting.`
      );
    } else if (duration <= 30) {
      insights.push(
        `Great! This ${duration}-minute meeting is concise and respects everyone's time.`
      );
    }

    // Attendee count insights
    if (attendees > 8) {
      insights.push(
        `With ${attendees} attendees, ensure everyone needs to be there. Removing just 2 unnecessary participants could save $${Math.round((totalCost / attendees) * 2)} per meeting.`
      );
    } else if (attendees >= 5 && attendees <= 8) {
      insights.push(
        `${attendees} attendees is a good size for productive discussions while maintaining efficiency.`
      );
    }

    // Cost per minute insight
    const costPerMinute = totalCost / duration;
    insights.push(
      `This meeting costs $${costPerMinute.toFixed(2)} per minute. Starting 5 minutes late costs $${(costPerMinute * 5).toFixed(2)}.`
    );

    // Annual cost insights
    if (annualCost && annualCost > 50000) {
      insights.push(
        `At $${annualCost.toLocaleString()} per year, this meeting represents a significant investment. Consider if it could be async, less frequent, or more focused.`
      );
    } else if (annualCost && annualCost > 10000) {
      insights.push(
        `This meeting costs $${annualCost.toLocaleString()} annually. Making it 15 minutes shorter would save approximately $${Math.round(annualCost * 0.25).toLocaleString()} per year.`
      );
    }

    // Alternative communication insight
    if (totalCost > 1000) {
      insights.push(
        `High-cost meeting detected. Could parts of this be handled through async communication like Slack, email, or a Loom video instead?`
      );
    }

    // Efficiency tip
    if (duration >= 60) {
      insights.push(
        `For longer meetings, set a clear agenda, assign a facilitator, and use time-boxing to keep discussions focused and productive.`
      );
    }

    return insights;
  }
}
