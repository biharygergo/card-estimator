import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoryPointCalculatorComponent } from './story-point-calculator.component';

describe('StoryPointCalculatorComponent', () => {
  let component: StoryPointCalculatorComponent;
  let fixture: ComponentFixture<StoryPointCalculatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoryPointCalculatorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoryPointCalculatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
