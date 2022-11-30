import { TestBed } from '@angular/core/testing';

import { AnalyticsService } from './analytics.service';
import { COMMON_MOCK_PROVIDERS } from './testing';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [COMMON_MOCK_PROVIDERS] });
    service = TestBed.inject(AnalyticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
