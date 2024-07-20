import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignUpOrLoginDialogComponent } from './sign-up-or-login-dialog.component';

describe('SignUpOrLoginDialogComponent', () => {
  let component: SignUpOrLoginDialogComponent;
  let fixture: ComponentFixture<SignUpOrLoginDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [SignUpOrLoginDialogComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(SignUpOrLoginDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
