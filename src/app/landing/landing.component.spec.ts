import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MOCK_ANALYTICS_SERVICE_PROVIDER } from '../services/testing/mock_analytics_service';

import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  let component: LandingComponent;
  let fixture: ComponentFixture<LandingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ LandingComponent ],
      providers: [MOCK_ANALYTICS_SERVICE_PROVIDER]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
