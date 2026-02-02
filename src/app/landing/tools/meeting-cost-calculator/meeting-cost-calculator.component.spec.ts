import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MeetingCostCalculatorComponent } from './meeting-cost-calculator.component';

describe('MeetingCostCalculatorComponent', () => {
  let component: MeetingCostCalculatorComponent;
  let fixture: ComponentFixture<MeetingCostCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MeetingCostCalculatorComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MeetingCostCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form initialization', () => {
    it('should initialize form with default values', () => {
      expect(component.meetingForm.value).toEqual({
        attendees: 5,
        avgHourlyRate: 75,
        duration: 60,
        frequency: 'weekly',
      });
    });

    it('should have valid form with default values', () => {
      expect(component.meetingForm.valid).toBeTruthy();
    });

    it('should invalidate form with attendees less than 1', () => {
      component.meetingForm.patchValue({ attendees: 0 });
      expect(component.meetingForm.get('attendees')?.valid).toBeFalsy();
    });

    it('should invalidate form with negative hourly rate', () => {
      component.meetingForm.patchValue({ avgHourlyRate: -10 });
      expect(component.meetingForm.get('avgHourlyRate')?.valid).toBeFalsy();
    });

    it('should invalidate form with duration less than 1', () => {
      component.meetingForm.patchValue({ duration: 0 });
      expect(component.meetingForm.get('duration')?.valid).toBeFalsy();
    });
  });

  describe('Calculation logic', () => {
    it('should calculate total cost correctly for default values', () => {
      // 5 attendees * $75/hr * 60 min / 60 = $375
      component.ngOnInit();
      const result = component.result();
      expect(result?.totalCost).toBe(375);
    });

    it('should calculate cost per minute correctly', () => {
      // $375 / 60 minutes = $6.25/min
      component.ngOnInit();
      const result = component.result();
      expect(result?.costPerMinute).toBe(6.25);
    });

    it('should calculate cost per attendee correctly', () => {
      // $375 / 5 attendees = $75 per attendee
      component.ngOnInit();
      const result = component.result();
      expect(result?.costPerAttendee).toBe(75);
    });

    it('should calculate annual cost for weekly meetings', () => {
      // $375 * 52 weeks = $19,500
      component.meetingForm.patchValue({ frequency: 'weekly' });
      component.ngOnInit();
      const result = component.result();
      expect(result?.annualCost).toBe(19500);
    });

    it('should calculate annual cost for monthly meetings', () => {
      // $375 * 12 months = $4,500
      component.meetingForm.patchValue({ frequency: 'monthly' });
      component.ngOnInit();
      const result = component.result();
      expect(result?.annualCost).toBe(4500);
    });

    it('should not calculate annual cost for one-time meetings', () => {
      component.meetingForm.patchValue({ frequency: 'once' });
      component.ngOnInit();
      const result = component.result();
      expect(result?.annualCost).toBeNull();
    });

    it('should recalculate when form values change', () => {
      component.ngOnInit();
      const initialResult = component.result();
      expect(initialResult?.totalCost).toBe(375);

      // Change attendees to 10
      component.meetingForm.patchValue({ attendees: 10 });
      fixture.detectChanges();

      const newResult = component.result();
      // 10 attendees * $75/hr * 60 min / 60 = $750
      expect(newResult?.totalCost).toBe(750);
    });
  });

  describe('Comparison generation', () => {
    it('should generate comparisons for default cost', () => {
      component.ngOnInit();
      const comparisons = component.comparisons();
      expect(comparisons.length).toBeGreaterThan(0);
    });

    it('should include lattes comparison for $375 cost', () => {
      component.ngOnInit();
      const comparisons = component.comparisons();
      const lattesComparison = comparisons.find((c) => c.icon === 'local_cafe');
      expect(lattesComparison).toBeTruthy();
      // $375 / $5 = 75 lattes
      expect(lattesComparison?.value).toBe('75');
    });

    it('should include developer hours comparison', () => {
      component.ngOnInit();
      const comparisons = component.comparisons();
      const devHoursComparison = comparisons.find((c) => c.icon === 'computer');
      expect(devHoursComparison).toBeTruthy();
      // $375 / $75 = 5.0 hours
      expect(devHoursComparison?.value).toBe('5.0');
    });

    it('should include books comparison', () => {
      component.ngOnInit();
      const comparisons = component.comparisons();
      const booksComparison = comparisons.find((c) => c.icon === 'menu_book');
      expect(booksComparison).toBeTruthy();
      // $375 / $40 = 9 books
      expect(booksComparison?.value).toBe('9');
    });

    it('should return limited comparisons for low costs', () => {
      // Set a low cost meeting
      component.meetingForm.patchValue({
        attendees: 2,
        avgHourlyRate: 50,
        duration: 15,
      });
      fixture.detectChanges();
      const comparisons = component.comparisons();
      // Should still return some comparisons but fewer
      expect(comparisons.length).toBeGreaterThan(0);
      expect(comparisons.length).toBeLessThanOrEqual(6);
    });
  });

  describe('Insight generation', () => {
    it('should generate insights for default values', () => {
      component.ngOnInit();
      const insights = component.insights();
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should suggest shorter meetings for long durations', () => {
      component.meetingForm.patchValue({ duration: 90 });
      fixture.detectChanges();
      const insights = component.insights();
      const longMeetingInsight = insights.find((i) =>
        i.includes('Consider breaking')
      );
      expect(longMeetingInsight).toBeTruthy();
    });

    it('should praise short meetings', () => {
      component.meetingForm.patchValue({ duration: 30 });
      fixture.detectChanges();
      const insights = component.insights();
      const shortMeetingInsight = insights.find((i) => i.includes('Great!'));
      expect(shortMeetingInsight).toBeTruthy();
    });

    it('should flag large meetings', () => {
      component.meetingForm.patchValue({ attendees: 10 });
      fixture.detectChanges();
      const insights = component.insights();
      const largeMeetingInsight = insights.find((i) =>
        i.includes('ensure everyone needs to be there')
      );
      expect(largeMeetingInsight).toBeTruthy();
    });

    it('should include cost per minute insight', () => {
      component.ngOnInit();
      const insights = component.insights();
      const costPerMinuteInsight = insights.find((i) =>
        i.includes('per minute')
      );
      expect(costPerMinuteInsight).toBeTruthy();
    });

    it('should warn about high annual costs', () => {
      component.meetingForm.patchValue({
        attendees: 10,
        avgHourlyRate: 100,
        duration: 120,
        frequency: 'weekly',
      });
      fixture.detectChanges();
      const insights = component.insights();
      // Annual cost: $2000 * 52 = $104,000
      const highCostInsight = insights.find(
        (i) => i.includes('per year') || i.includes('annually')
      );
      expect(highCostInsight).toBeTruthy();
    });

    it('should suggest async communication for very expensive meetings', () => {
      component.meetingForm.patchValue({
        attendees: 20,
        avgHourlyRate: 100,
        duration: 60,
      });
      fixture.detectChanges();
      const insights = component.insights();
      // Total cost: $2000
      const asyncInsight = insights.find((i) =>
        i.includes('async communication')
      );
      expect(asyncInsight).toBeTruthy();
    });

    it('should provide agenda tips for longer meetings', () => {
      component.meetingForm.patchValue({ duration: 60 });
      fixture.detectChanges();
      const insights = component.insights();
      const agendaInsight = insights.find((i) =>
        i.includes('agenda') || i.includes('time-boxing')
      );
      expect(agendaInsight).toBeTruthy();
    });
  });

  describe('Reactivity', () => {
    it('should update result when attendees change', () => {
      component.ngOnInit();
      const initialCost = component.result()?.totalCost;

      component.meetingForm.patchValue({ attendees: 10 });
      fixture.detectChanges();

      const newCost = component.result()?.totalCost;
      expect(newCost).not.toBe(initialCost);
      expect(newCost).toBe(750); // 10 * 75 * 1
    });

    it('should update comparisons when cost changes', () => {
      component.ngOnInit();
      const initialComparisons = component.comparisons().length;

      component.meetingForm.patchValue({ attendees: 1, duration: 15 });
      fixture.detectChanges();

      const newComparisons = component.comparisons().length;
      // Lower cost should potentially result in fewer comparisons
      expect(newComparisons).toBeLessThanOrEqual(initialComparisons);
    });

    it('should update insights when parameters change', () => {
      component.meetingForm.patchValue({ duration: 30 });
      fixture.detectChanges();
      const shortMeetingInsights = component.insights();

      component.meetingForm.patchValue({ duration: 120 });
      fixture.detectChanges();
      const longMeetingInsights = component.insights();

      expect(shortMeetingInsights).not.toEqual(longMeetingInsights);
    });
  });
});
