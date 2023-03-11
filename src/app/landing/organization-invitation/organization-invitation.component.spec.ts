import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationInvitationComponent } from './organization-invitation.component';

describe('OrganizationInvitationComponent', () => {
  let component: OrganizationInvitationComponent;
  let fixture: ComponentFixture<OrganizationInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrganizationInvitationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrganizationInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
