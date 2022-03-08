import { TestBed } from '@angular/core/testing';

import { SerializerService } from './serializer.service';

describe('SerializerService', () => {
  let service: SerializerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SerializerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
