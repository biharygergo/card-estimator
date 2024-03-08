import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageEmailModalComponent } from './manage-email-modal.component';

describe('ManageEmailModalComponent', () => {
  let component: ManageEmailModalComponent;
  let fixture: ComponentFixture<ManageEmailModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageEmailModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ManageEmailModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
