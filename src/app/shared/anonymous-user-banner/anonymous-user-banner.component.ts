import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  EMPTY,
  from,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'anonymous-user-banner',
  templateUrl: './anonymous-user-banner.component.html',
  styleUrls: ['./anonymous-user-banner.component.scss'],
})
export class AnonymousUserBannerComponent implements OnInit {
  isBusy = new BehaviorSubject<boolean>(false);
  onSignUpClicked = new Subject<void>();
  destroy = new Subject<void>();

  user = this.authService.user;

  constructor(
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.onSignUpClicked
      .pipe(
        switchMap(() => {
          this.isBusy.next(true);
          return from(this.authService.linkAccountWithGoogle()).pipe(
            tap(() => {
              this.isBusy.next(false);
              this.snackBar.open(`Your account is now set up, awesome!`, 'OK', {
                duration: 3000,
              });
            }),
            catchError((error) => {
              this.isBusy.next(false);
              this.snackBar.open(
                `Failed to link account with Google. The issue is: ${error.message}`,
                'OK',
                {
                  duration: 3000,
                }
              );
              return of({});
            })
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }
}
