import { TestBed } from '@angular/core/testing';

import { IssueIntegrationService } from './issue-integration.service';

describe('IssueIntegrationService', () => {
  let service: IssueIntegrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueIntegrationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
