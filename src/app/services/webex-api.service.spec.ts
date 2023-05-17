import { TestBed } from '@angular/core/testing';

import { WebexApiService } from './webex-api.service';

describe('WebexApiService', () => {
  let service: WebexApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebexApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
