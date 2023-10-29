import { TestBed } from '@angular/core/testing';

import { RoomDataService } from './room-data.service';

describe('RoomDataService', () => {
  let service: RoomDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoomDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
