import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportIssueModalComponent } from './report-issue-modal.component';

describe('ReportIssueModalComponent', () => {
  let component: ReportIssueModalComponent;
  let fixture: ComponentFixture<ReportIssueModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportIssueModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportIssueModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
