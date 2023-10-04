import { TestBed } from '@angular/core/testing';

import { ReactionsService } from './reactions.service';

describe('ReactionsService', () => {
  let service: ReactionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReactionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
