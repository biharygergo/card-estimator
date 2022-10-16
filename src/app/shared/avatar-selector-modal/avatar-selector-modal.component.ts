import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { User } from 'firebase/auth';
import { BehaviorSubject, from, of, Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { ComponentType } from '@angular/cdk/portal';
import { MatDialogConfig, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

export type ModalCreator<T> = [ComponentType<T>, MatDialogConfig];

export interface AvatarDialogData {
  openAtTab?: 'profile' | 'avatar';
}
export const avatarModalCreator = ({
  openAtTab,
}: AvatarDialogData): ModalCreator<AvatarSelectorModalComponent> => [
  AvatarSelectorModalComponent,
  {
    id: AVATAR_SELECTOR_MODAL,
    width: '90%',
    maxWidth: '600px',
    data: {
      openAtTab,
    },
  },
];

type Avatar = {
  name: string;
  url: string;
};

const createAvatars = (count: number, seed?: string): Avatar[] => {
  const avatars: Avatar[] = [];
  for (let i = 0; i < count; i++) {
    avatars.push({
      name: `Avatar ${i + 1}`,
      url: `https://avatars.dicebear.com/api/avataaars/${
        seed ?? ''
      }${i}.svg?style=circle&backgroundColor=%23ffffff&mouth=default,smile&eyebrow=default,defaultNatural,flat,flatNatural,raised,raisedExcited,raisedExcitedNatural&eyes=default,roll,eyeRoll,happy,hearts,side,squint,surprised,wink,winkWacky`,
    });
  }
  return avatars;
};
export const AVATAR_SELECTOR_MODAL = 'avatar-selector-modal';
const AVATAR_COUNT = 109;
@Component({
  selector: 'app-avatar-selector-modal',
  templateUrl: './avatar-selector-modal.component.html',
  styleUrls: ['./avatar-selector-modal.component.scss'],
})
export class AvatarSelectorModalComponent implements OnInit, OnDestroy {
  selectedTabIndex = this.dialogData.openAtTab === 'avatar' ? 1 : 0;

  avatars = createAvatars(AVATAR_COUNT);
  user: User | undefined;
  readonly isSavingUser = new BehaviorSubject<boolean>(false);
  readonly onClickUpdateUserName = new Subject<void>();
  destroy = new Subject<void>();

  displayNameForm = new FormControl('');
  accountTypeForm = new FormControl({ value: '', disabled: true });

  constructor(
    private auth: AuthService,
    private analytics: AnalyticsService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) private dialogData: AvatarDialogData
  ) {}

  ngOnInit(): void {
    this.auth.user.pipe(takeUntil(this.destroy)).subscribe((user) => {
      this.user = user;
      this.displayNameForm.setValue(user.displayName);
      this.accountTypeForm.setValue(
        user.isAnonymous ? 'Anonymous' : 'Permanent'
      );
    });

    this.onClickUpdateUserName
      .pipe(
        tap(() => this.isSavingUser.next(true)),
        switchMap(() =>
          from(this.updateName()).pipe(
            catchError((error) => {
              this.snackBar.open(
                'An error occured while updating your profile: ' +
                  error?.message,
                null,
                { duration: 2000, horizontalPosition: 'right' }
              );
              return of({});
            })
          )
        ),
        tap(() => {
          this.snackBar.open('Profile updated!', null, {
            horizontalPosition: 'right',
            duration: 3000,
          });
          this.isSavingUser.next(false);
        }),
        takeUntil(this.destroy)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  selectAvatar(avatar: Avatar | null) {
    this.auth.updateAvatar(avatar ? avatar.url : null);
    this.analytics.logSelectedAvatar(avatar?.url ?? 'default');
  }

  randomizeAvatars() {
    this.avatars = createAvatars(AVATAR_COUNT, Math.random().toString());
    this.analytics.logClickedRandomizeAvatars();
  }

  updateName() {
    return this.auth.updateDisplayName(this.user, this.displayNameForm.value);
  }

  get isNameUpdated() {
    return (
      this.user?.displayName !== this.displayNameForm.value &&
      this.displayNameForm.value
    );
  }
}
