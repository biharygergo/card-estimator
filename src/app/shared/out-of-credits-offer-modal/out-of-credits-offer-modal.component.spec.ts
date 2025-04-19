import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutOfCreditsOfferModalComponent } from './out-of-credits-offer-modal.component';

describe('OutOfCreditsOfferModalComponent', () => {
  let component: OutOfCreditsOfferModalComponent;
  let fixture: ComponentFixture<OutOfCreditsOfferModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutOfCreditsOfferModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutOfCreditsOfferModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
