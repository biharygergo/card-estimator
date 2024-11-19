import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegrationPageTemplateComponent } from './integration-page-template.component';

describe('IntegrationPageTemplateComponent', () => {
  let component: IntegrationPageTemplateComponent;
  let fixture: ComponentFixture<IntegrationPageTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrationPageTemplateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntegrationPageTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
