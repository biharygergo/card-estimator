import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthProgressDialogComponent } from './auth-progress-dialog.component';

describe('AuthProgressDialogComponent', () => {
  let component: AuthProgressDialogComponent;
  let fixture: ComponentFixture<AuthProgressDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AuthProgressDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthProgressDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
