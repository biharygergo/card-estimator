import { TestBed } from '@angular/core/testing';

import { SlackService } from './slack.service';

describe('SlackService', () => {
  let service: SlackService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlackService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
