import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CarbonAdComponent } from './carbon-ad.component';

describe('CarbonAdComponent', () => {
  let component: CarbonAdComponent;
  let fixture: ComponentFixture<CarbonAdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CarbonAdComponent],
    });
    fixture = TestBed.createComponent(CarbonAdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
