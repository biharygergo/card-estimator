import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumInAppModalComponent } from './premium-in-app-modal.component';

describe('PremiumInAppModalComponent', () => {
  let component: PremiumInAppModalComponent;
  let fixture: ComponentFixture<PremiumInAppModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PremiumInAppModalComponent]
    });
    fixture = TestBed.createComponent(PremiumInAppModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
