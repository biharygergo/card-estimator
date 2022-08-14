import { TestBed } from '@angular/core/testing';

import { ZoomApiService } from './zoom-api.service';

describe('ZoomApiService', () => {
  let service: ZoomApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZoomApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
