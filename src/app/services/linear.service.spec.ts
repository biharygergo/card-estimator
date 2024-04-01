import { TestBed } from '@angular/core/testing';

import { LinearService } from './linear.service';

describe('LinearService', () => {
  let service: LinearService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinearService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
