import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecurringMeetingsModalComponent } from './recurring-meetings-modal.component';

describe('RecurringMeetingsModalComponent', () => {
  let component: RecurringMeetingsModalComponent;
  let fixture: ComponentFixture<RecurringMeetingsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringMeetingsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringMeetingsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
