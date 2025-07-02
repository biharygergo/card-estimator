import { TestBed } from '@angular/core/testing';

import { IssueReportService } from './issue-report.service';

describe('IssueReportService', () => {
  let service: IssueReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
