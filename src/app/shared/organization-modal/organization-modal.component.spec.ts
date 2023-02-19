import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationModalComponent } from './organization-modal.component';

describe('OrganizationModalComponent', () => {
  let component: OrganizationModalComponent;
  let fixture: ComponentFixture<OrganizationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrganizationModalComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
