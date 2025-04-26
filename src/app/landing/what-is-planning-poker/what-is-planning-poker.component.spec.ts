import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatIsPlanningPokerComponent } from './what-is-planning-poker.component';

describe('WhatIsPlanningPokerComponent', () => {
  let component: WhatIsPlanningPokerComponent;
  let fixture: ComponentFixture<WhatIsPlanningPokerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatIsPlanningPokerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatIsPlanningPokerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
