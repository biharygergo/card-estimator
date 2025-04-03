import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingTableComponent } from './pricing-table.component';

describe('PricingTableComponent', () => {
  let component: PricingTableComponent;
  let fixture: ComponentFixture<PricingTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PricingTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
