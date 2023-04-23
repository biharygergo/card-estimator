import { TestBed } from '@angular/core/testing';

import { RecurringMeetingLinkService } from './recurring-meeting-link.service';

describe('RecurringMeetingLinkService', () => {
  let service: RecurringMeetingLinkService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecurringMeetingLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
