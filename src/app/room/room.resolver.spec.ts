import { TestBed } from '@angular/core/testing';

import { RoomResolver } from './room.resolver';

describe('RoomResolver', () => {
  let resolver: RoomResolver;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    resolver = TestBed.inject(RoomResolver);
  });

  it('should be created', () => {
    expect(resolver).toBeTruthy();
  });
});
