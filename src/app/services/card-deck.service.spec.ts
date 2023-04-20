import { TestBed } from '@angular/core/testing';

import { CardDeckService } from './card-deck.service';

describe('CardDeckService', () => {
  let service: CardDeckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CardDeckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
