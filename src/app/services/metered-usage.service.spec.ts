import { TestBed } from '@angular/core/testing';

import { MeteredUsageService } from './metered-usage.service';

describe('MeteredUsageService', () => {
  let service: MeteredUsageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeteredUsageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
