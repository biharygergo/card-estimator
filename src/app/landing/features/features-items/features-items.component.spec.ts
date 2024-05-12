import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturesItemsComponent } from './features-items.component';

describe('FeaturesItemsComponent', () => {
  let component: FeaturesItemsComponent;
  let fixture: ComponentFixture<FeaturesItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeaturesItemsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FeaturesItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
