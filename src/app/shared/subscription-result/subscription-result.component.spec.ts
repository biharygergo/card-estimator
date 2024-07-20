import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionResultComponent } from './subscription-result.component';

describe('SubscriptionResultComponent', () => {
  let component: SubscriptionResultComponent;
  let fixture: ComponentFixture<SubscriptionResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SubscriptionResultComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SubscriptionResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
