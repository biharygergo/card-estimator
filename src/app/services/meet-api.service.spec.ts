import { TestBed } from '@angular/core/testing';

import { MeetApiService } from './meet-api.service';

describe('MeetApiService', () => {
  let service: MeetApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MeetApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
