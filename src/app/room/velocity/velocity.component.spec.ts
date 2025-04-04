import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VelocityComponent } from './velocity.component';

describe('VelocityComponent', () => {
  let component: VelocityComponent;
  let fixture: ComponentFixture<VelocityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VelocityComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VelocityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
