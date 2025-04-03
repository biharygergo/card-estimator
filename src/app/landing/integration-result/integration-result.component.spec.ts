import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationResultComponent } from './integration-result.component';

describe('IntegrationResultComponent', () => {
  let component: IntegrationResultComponent;
  let fixture: ComponentFixture<IntegrationResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrationResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
