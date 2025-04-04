import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintablePlanningPokerCardsComponent } from './printable-planning-poker-cards.component';

describe('PrintablePlanningPokerCardsComponent', () => {
  let component: PrintablePlanningPokerCardsComponent;
  let fixture: ComponentFixture<PrintablePlanningPokerCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrintablePlanningPokerCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrintablePlanningPokerCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
