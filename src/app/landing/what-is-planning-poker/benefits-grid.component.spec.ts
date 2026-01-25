import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BenefitsGridComponent } from './benefits-grid.component';

describe('BenefitsGridComponent', () => {
  let component: BenefitsGridComponent;
  let fixture: ComponentFixture<BenefitsGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BenefitsGridComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BenefitsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 6 benefits', () => {
    expect(component.benefits.length).toBe(6);
  });

  it('should have all required benefit properties', () => {
    component.benefits.forEach(benefit => {
      expect(benefit.title).toBeTruthy();
      expect(benefit.description).toBeTruthy();
      expect(benefit.icon).toBeTruthy();
    });
  });
});
