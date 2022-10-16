import { Component, Inject, Input, OnInit } from '@angular/core';
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
import { APP_CONFIG, AppConfig } from 'src/app/app-config.module';
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

  @Input() bannerStyle: 'default' | 'gray' = 'default';

  constructor(
    private readonly authService: AuthService,
    private readonly snackBar: MatSnackBar,
    @Inject(APP_CONFIG) public config: AppConfig
  ) {}

  ngOnInit(): void {
    this.onSignUpClicked
      .pipe(
        switchMap(() => {
          this.isBusy.next(true);
          return from(this.authService.linkAccountWithGoogle()).pipe(
            tap(() => {
              this.isBusy.next(false);
              this.snackBar.open(`Your account is now set up, awesome!`, null, {
                duration: 3000,
                horizontalPosition: 'right',
              });
            }),
            catchError((error) => {
              this.isBusy.next(false);
              this.snackBar.open(
                `Failed to link account with Google. The issue is: ${error.message}`,
                null,
                {
                  duration: 3000,
                  horizontalPosition: 'right',
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
