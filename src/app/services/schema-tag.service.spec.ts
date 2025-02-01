import { TestBed } from '@angular/core/testing';

import { SchemaTagService } from './schema-tag.service';

describe('SchemaTagService', () => {
  let service: SchemaTagService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SchemaTagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
