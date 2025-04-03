import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumLearnMoreComponent } from './premium-learn-more.component';

describe('PremiumLearnMoreComponent', () => {
  let component: PremiumLearnMoreComponent;
  let fixture: ComponentFixture<PremiumLearnMoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumLearnMoreComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumLearnMoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
