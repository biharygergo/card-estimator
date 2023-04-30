import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringMeetingComponent } from './recurring-meeting.component';

describe('RecurringMeetingComponent', () => {
  let component: RecurringMeetingComponent;
  let fixture: ComponentFixture<RecurringMeetingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ RecurringMeetingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecurringMeetingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
