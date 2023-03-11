import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { EstimatorService } from '../services/estimator.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Member, MemberType, MemberStatus, Organization } from '../types';
import { AnalyticsService } from '../services/analytics.service';
import { AuthService } from '../services/auth.service';
import { CookieService } from '../services/cookie.service';

import {
  BehaviorSubject,
  combineLatest,
  EMPTY,
  firstValueFrom,
  from,
  Observable,
  of,
  Subject,
} from 'rxjs';
import {
  catchError,
  filter,
  finalize,
  first,
  map,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { User } from 'firebase/auth';
import { AppConfig, AppConfigModule, APP_CONFIG } from '../app-config.module';
import {
  delayedFadeAnimation,
  fadeAnimation,
  slideInRightAnimation,
} from '../shared/animations';
import { MatDialog } from '@angular/material/dialog';
import {
  authProgressDialogCreator,
  AuthProgressState,
} from '../shared/auth-progress-dialog/auth-progress-dialog.component';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { ZoomAppBannerComponent } from '../shared/zoom-app-banner/zoom-app-banner.component';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { roomAuthenticationModalCreator } from '../shared/room-authentication-modal/room-authentication-modal.component';
import { OrganizationService } from '../services/organization.service';
import { premiumLearnMoreModalCreator } from '../shared/premium-learn-more/premium-learn-more.component';
import { avatarModalCreator } from '../shared/avatar-selector-modal/avatar-selector-modal.component';

enum PageMode {
  CREATE = 'create',
  JOIN = 'join',
}

interface ViewModel {
  user: User | undefined;
  roomId: string | undefined;
  mode: PageMode;
}

@Component({
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SharedModule,
    ZoomAppBannerComponent,
    AppConfigModule,
  ],
  selector: 'app-create-or-join-room',
  templateUrl: './create-or-join-room.component.html',
  styleUrls: ['./create-or-join-room.component.scss'],
  animations: [fadeAnimation, delayedFadeAnimation, slideInRightAnimation],
})
export class CreateOrJoinRoomComponent implements OnInit, OnDestroy {
  name = new FormControl<string>('');
  roomId = new FormControl<string>('');
  joinAs = new FormControl<MemberType>(MemberType.ESTIMATOR);

  isBusy = new BehaviorSubject<boolean>(false);
  isLoadingUser = new BehaviorSubject<boolean>(true);
  onJoinRoomClicked = new Subject<void>();
  onCreateRoomClicked = new Subject<void>();
  onSignInClicked = new Subject<void>();

  destroy = new Subject<void>();

  user = combineLatest([this.authService.user, this.isBusy]).pipe(
    filter(([_, busy]) => !busy),
    tap(([user]) => {
      if (user && user.displayName) {
        this.name.setValue(user.displayName);
      }
    }),
    map(([user]) => user)
  );

  roomIdFromParams: Observable<string> = this.activatedRoute.queryParamMap.pipe(
    map((paramMap) => paramMap.get('roomId')),
    tap((roomId) => {
      if (roomId) {
        this.roomId.setValue(roomId);
        this.analytics.logAutoFilledRoomId();
      }
    })
  );

  flowFromParams$: Observable<string> = this.activatedRoute.queryParamMap.pipe(
    map((paramMap) => paramMap.get('flow'))
  );

  currentPath: Observable<string> = this.activatedRoute.url.pipe(
    map((segments) => [...segments]?.pop()?.path)
  );

  pageMode: Observable<PageMode> = this.currentPath.pipe(
    map((path) => {
      return path === 'create' ? PageMode.CREATE : PageMode.JOIN;
    })
  );

  vm: Observable<ViewModel> = combineLatest([
    this.roomIdFromParams,
    this.currentPath,
    this.user,
    this.isBusy,
  ]).pipe(
    filter(([_params, _path, _user, busy]) => !busy),
    map(([roomIdFromParams, currentPath, user]) => {
      const roomId = roomIdFromParams;
      const mode = currentPath === 'create' ? PageMode.CREATE : PageMode.JOIN;
      return { roomId, mode, user };
    }),
    tap(() => this.isLoadingUser.next(false))
  );

  organization: Observable<Organization | undefined> = this.user.pipe(
    switchMap((user) => {
      if (!user?.isAnonymous) {
        return this.organizationService.getMyOrganization();
      } else {
        return of(undefined);
      }
    })
  );

  readonly PageMode = PageMode;
  readonly MemberType = MemberType;

  constructor(
    private estimatorService: EstimatorService,
    private router: Router,
    private snackBar: MatSnackBar,
    private activatedRoute: ActivatedRoute,
    private analytics: AnalyticsService,
    private authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly dialog: MatDialog,
    private readonly organizationService: OrganizationService,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {}

  ngOnInit(): void {
    this.cookieService.tryShowCookieBanner();

    const sessionCookie = this.authService.getSessionCookie();
    if (
      this.config.isRunningInZoom &&
      sessionCookie &&
      typeof sessionCookie !== 'string'
    ) {
      this.dialog.open(
        ...authProgressDialogCreator({
          initialState: AuthProgressState.IN_PROGRESS,
          startAccountSetupOnOpen: true,
        })
      );
    }

    this.onJoinRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() =>
          from(this.joinRoom()).pipe(
            catchError((e) => {
              if (e.code !== 'permission-denied') {
                this.showUnableToJoinRoom();
                return of(false);
              } else {
                const dialogRef = this.dialog.open(
                  ...roomAuthenticationModalCreator({
                    roomId: this.roomId.value,
                  })
                );
                return dialogRef.afterClosed().pipe(
                  first(),
                  switchMap((result) => {
                    if (result !== '' && result?.joined) {
                      return from(this.joinRoom());
                    } else {
                      return of(false);
                    }
                  })
                );
              }
            })
          )
        ),
        tap(() => this.isBusy.next(false)),
        takeUntil(this.destroy)
      )
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['room', this.roomId.value]);
        }
      });

    this.onCreateRoomClicked
      .pipe(
        tap(() => {
          this.isBusy.next(true);
        }),
        switchMap(() => from(this.createRoom())),
        takeUntil(this.destroy),
        finalize(() => this.isBusy.next(false))
      )
      .subscribe();

    this.onSignInClicked
      .pipe(
        tap(() => {
          this.dialog.open(
            ...signUpOrLoginDialogCreator({
              intent: SignUpOrLoginIntent.SIGN_IN,
            })
          );
        }),
        withLatestFrom(this.currentPath),
        tap(([_, currentPath]) => {
          this.analytics.logClickedSignIn(
            currentPath === 'create' ? 'create' : 'join'
          );
        }),
        takeUntil(this.destroy)
      )
      .subscribe();

    this.flowFromParams$
      .pipe(takeUntil(this.destroy))
      .subscribe(async (flowParam) => {
        if (flowParam === 'premium') {
          this.dialog.open(...premiumLearnMoreModalCreator());
        } else if (flowParam === 'manageSubscription') {
          const user = await this.authService.getUser();
          if (user) {
            this.dialog.open(
              ...avatarModalCreator({ openAtTab: 'subscription' })
            );
          } else {
            this.dialog.open(
              ...signUpOrLoginDialogCreator({
                intent: SignUpOrLoginIntent.SIGN_IN,
              })
            );
          }
        }
      });
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }

  async joinRoom(): Promise<boolean> {
    const member: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    this.snackBar.dismiss();
    await this.estimatorService.joinRoom(this.roomId.value, member);

    const isObserver = this.joinAs.value === MemberType.OBSERVER;
    if (isObserver) {
      this.analytics.logClickedJoinAsObserver();
    } else {
      this.analytics.logClickedJoinedRoom();
    }

    return true;
  }

  showUnableToJoinRoom() {
    this.snackBar.open(
      'Unable to join room. Please check the ID and try again.',
      null,
      { duration: 3000, horizontalPosition: 'right' }
    );
  }

  signOut() {
    return this.authService.signOut();
  }

  async createRoom() {
    const newMember: Member = {
      id: null,
      name: this.name.value,
      type: this.joinAs.value,
      status: MemberStatus.ACTIVE,
    };

    const { room } = await this.estimatorService.createRoom(newMember);

    this.analytics.logClickedCreateNewRoom();
    return this.router.navigate(['room', room.roomId]);
  }

  onNameBlur() {
    this.analytics.logFilledNameInput();
  }

  onRoomIdBlur() {
    this.analytics.logFilledRoomId();
  }
}
