import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartPlanningCtaComponent } from './start-planning-cta.component';

describe('StartPlanningCtaComponent', () => {
  let component: StartPlanningCtaComponent;
  let fixture: ComponentFixture<StartPlanningCtaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StartPlanningCtaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StartPlanningCtaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
