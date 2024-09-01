import { TestBed } from '@angular/core/testing';

import { IssueIntegrationServiceService } from './issue-integration.service';

describe('IssueIntegrationServiceService', () => {
  let service: IssueIntegrationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueIntegrationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
