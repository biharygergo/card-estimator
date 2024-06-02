import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { createModal } from '../avatar-selector-modal/avatar-selector-modal.component';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from 'src/app/services/auth.service';
import {
  Observable,
  Subject,
  combineLatest,
  distinctUntilChanged,
  map,
  takeUntil,
} from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ToastService } from 'src/app/services/toast.service';
import { FirebaseModule } from 'src/app/firebase.module';

@Component({
  selector: 'app-manage-email-modal',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FirebaseModule
  ],
  templateUrl: './manage-email-modal.component.html',
  styleUrl: './manage-email-modal.component.scss',
})
export class ManageEmailModalComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  dialogRef = inject(MatDialogRef);
  toastService = inject(ToastService);

  user$ = this.authService.user;
  passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });

  userEmail$ = this.user$.pipe(
    map((user) => user?.email),
    distinctUntilChanged()
  );

  isEmailDifferent: Observable<boolean> = combineLatest([
    this.userEmail$,
    this.emailControl.valueChanges,
  ]).pipe(map(([userEmail, enteredEmail]) => userEmail !== enteredEmail));

  isSubmitEnabled = combineLatest([
    this.emailControl.statusChanges,
    this.passwordControl.statusChanges,
    this.isEmailDifferent,
  ]).pipe(
    map(
      ([emailStatus, passwordStatus, isDifferent]) =>
        emailStatus === 'VALID' && passwordStatus === 'VALID' && isDifferent
    )
  );

  destroy = new Subject<void>();

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  async updateEmail() {
    await this.authService.updateCurrentUserEmail(
      this.emailControl.value,
      this.passwordControl.value
    );
    this.toastService.showMessage('E-mail updated!');
    this.dialogRef.close();
  }
}

export const manageEmailModalCreator = () =>
  createModal(ManageEmailModalComponent, {
    id: 'manageEmailModal',
    data: {},
  });
