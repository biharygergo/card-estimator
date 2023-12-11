import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntroducingNewPricingModalComponent } from './introducing-new-pricing-modal.component';

describe('IntroducingNewPricingModalComponent', () => {
  let component: IntroducingNewPricingModalComponent;
  let fixture: ComponentFixture<IntroducingNewPricingModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntroducingNewPricingModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IntroducingNewPricingModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
