import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummaryModalComponent } from './summary-modal.component';

describe('SummaryModalComponent', () => {
  let component: SummaryModalComponent;
  let fixture: ComponentFixture<SummaryModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
