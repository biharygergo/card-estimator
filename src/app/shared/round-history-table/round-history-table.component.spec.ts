import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoundHistoryTableComponent } from './round-history-table.component';

describe('RoundHistoryTableComponent', () => {
  let component: RoundHistoryTableComponent;
  let fixture: ComponentFixture<RoundHistoryTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RoundHistoryTableComponent],
    });
    fixture = TestBed.createComponent(RoundHistoryTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
