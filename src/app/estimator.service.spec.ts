import { TestBed } from '@angular/core/testing';

import { EstimatorService } from './estimator.service';

describe('EstimatorService', () => {
  let service: EstimatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstimatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
