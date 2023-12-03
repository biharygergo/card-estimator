import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { User } from 'firebase/auth';
import { BehaviorSubject, from, Observable, of, Subject } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { AnalyticsService } from 'src/app/services/analytics.service';
import { ComponentType } from '@angular/cdk/portal';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { FormControl, UntypedFormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  PaymentService,
  StripeSubscription,
} from 'src/app/services/payment.service';
import { premiumLearnMoreModalCreator } from '../premium-learn-more/premium-learn-more.component';
import { BundleWithCredits, Credit, getBundleTitle } from 'src/app/types';
import * as moment from 'moment';

export type ModalCreator<T> = [ComponentType<T>, MatDialogConfig];

export interface AvatarDialogData {
  openAtTab?: 'profile' | 'avatar' | 'subscription';
}

export const avatarModalCreator = ({
  openAtTab,
}: AvatarDialogData): ModalCreator<AvatarSelectorModalComponent> => [
  AvatarSelectorModalComponent,
  {
    id: AVATAR_SELECTOR_MODAL,
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    data: {
      openAtTab,
    },
    panelClass: 'custom-dialog',
  },
];

type Avatar = {
  name: string;
  url: string;
};

const createAvatars = (
  count: number,
  facialHair: string,
  hair: string,
  skinTone: string,
  seed?: string
): Avatar[] => {
  const avatars: Avatar[] = [];
  if (facialHair === '') {
    facialHair = facialHairOptions[1].value;
  }
  if (hair === '') {
    hair = hairOptions.map((option) => option.value).join(',');
  }
  if (skinTone === '') {
    skinTone = skinToneOptions.map((option) => option.value).join(',');
  }

  for (let i = 0; i < count; i++) {
    avatars.push({
      name: `Avatar ${i + 1}`,
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${
        seed ?? ''
      }${i}&style=circle&backgroundColor=ffffff&mouth=default,smile&eyebrows=default,defaultNatural,flatNatural,raisedExcited,raisedExcitedNatural&eyes=default,eyeRoll,happy,hearts,side,squint,surprised,wink,winkWacky&top=${hair}&skinColor=${skinTone}`,
    });
  }
  return avatars;
};

const hairOptions: SelectOption[] = [
  'bigHair',
  'bun',
  'curly',
  'curvy',
  'dreads',
  'frizzle',
  'fro',
  'hat',
  'hijab',
  'shaggy',
  'shavedSides',
  'shortCurly',
  'shortFlat',
  'shortRound',
  'shortWaved',
  'sides',
  'straight01',
  'turban',
  'winterHat02',
].map((value) => ({ label: value, value }));

const skinToneOptions: SelectOption[] = [
  '614335',
  'ae5d29',
  'd08b5b',
  'edb98a',
  'f8d25c',
  'fd9841',
  'ffdbb4',
].map((colorCode) => ({ value: colorCode, label: colorCode }));

const facialHairOptions: SelectOption[] = [
  {
    label: 'None',
    value: '0',
  },
  {
    label: 'Maybe',
    value: '50',
  },
  { label: 'Always', value: '100' },
];

interface SelectOption {
  label: string;
  value: string;
}

export const AVATAR_SELECTOR_MODAL = 'avatar-selector-modal';
const AVATAR_COUNT = 39;
@Component({
  selector: 'app-avatar-selector-modal',
  templateUrl: './avatar-selector-modal.component.html',
  styleUrls: ['./avatar-selector-modal.component.scss'],
})
export class AvatarSelectorModalComponent implements OnInit, OnDestroy {
  selectedTabIndex = { profile: 0, subscription: 1, avatar: 2 }[
    this.dialogData.openAtTab ?? 'profile'
  ];

  facialHairOptions: SelectOption[] = facialHairOptions;
  hairOptions: SelectOption[] = hairOptions;
  skinToneOptions: SelectOption[] = skinToneOptions;

  selectedFacialHairOption = facialHairOptions[1].value;
  selectedHairOptions = hairOptions.reduce((acc, curr) => {
    acc[curr.value] = true;
    return acc;
  }, {});
  selectedSkinToneOptions = skinToneOptions.reduce((acc, curr) => {
    acc[curr.value] = true;
    return acc;
  }, {});

  avatars = createAvatars(
    AVATAR_COUNT,
    this.selectedFacialHairOption,
    Object.keys(this.selectedHairOptions)
      .filter((key) => this.selectedHairOptions[key])
      .join(','),
    Object.keys(this.selectedSkinToneOptions)
      .filter((key) => this.selectedSkinToneOptions[key])
      .join(',')
  );
  user: User | undefined;
  readonly isSavingUser = new BehaviorSubject<boolean>(false);
  readonly onClickUpdateUserName = new Subject<void>();
  destroy = new Subject<void>();

  displayNameForm = new UntypedFormControl('');
  accountTypeForm = new UntypedFormControl({ value: '', disabled: true });
  emailControl = new FormControl<string>({ value: '', disabled: true });

  subscription$: Observable<StripeSubscription> =
    this.paymentsService.getSubscription();

  activePlan$ = this.subscription$.pipe(
    map((subscription) => subscription?.items?.[0]?.plan)
  );

  creditBundles$: Observable<
    Array<
      BundleWithCredits & {
        title: string;
        availableCredits: Credit[];
        expiresInReadable: string;
        isExpired: boolean;
      }
    >
  > = from(this.paymentsService.getAndAssignCreditBundles()).pipe(
    map((creditBundles) => {
      return creditBundles.map((bundle) => ({
        ...bundle,
        title: getBundleTitle(bundle.name),
        availableCredits: bundle.credits.filter((c) => !c.usedForRoomId),
        expiresInReadable: moment(bundle.expiresAt.toDate()).fromNow(),
        isExpired: moment(bundle.expiresAt.toDate()).isBefore(moment()),
      }));
    })
  );

  isLoadingStripe = false;

  constructor(
    private auth: AuthService,
    private analytics: AnalyticsService,
    private snackBar: MatSnackBar,
    public readonly paymentsService: PaymentService,
    public dialogRef: MatDialogRef<AvatarSelectorModalComponent>,
    private readonly dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private dialogData: AvatarDialogData
  ) {}

  ngOnInit(): void {
    this.auth.user.pipe(takeUntil(this.destroy)).subscribe((user) => {
      this.user = user;
      this.displayNameForm.setValue(user?.displayName);
      this.accountTypeForm.setValue(
        user?.isAnonymous ? 'Anonymous' : 'Permanent'
      );
      this.emailControl.setValue(user?.email);
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
    this.avatars = createAvatars(
      AVATAR_COUNT,
      this.selectedFacialHairOption,
      Object.keys(this.selectedHairOptions)
        .filter((key) => this.selectedHairOptions[key])
        .join(','),
      Object.keys(this.selectedSkinToneOptions)
        .filter((key) => this.selectedSkinToneOptions[key])
        .join(','),
      Math.random().toString()
    );
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

  signOut() {
    this.auth.signOut();
    this.dialogRef.close();
  }

  async redirectToCustomerPortal() {
    this.isLoadingStripe = true;
    this.analytics.logClickedManageSubscription('profile');
    await this.paymentsService.createPortalLink();
  }

  openLearnMore() {
    this.analytics.logClickedLearnMorePremium('profile');
    this.dialog.open(...premiumLearnMoreModalCreator());
  }
}
