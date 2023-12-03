import { Inject, Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  addDoc,
  collectionData,
  docData,
  Firestore,
  query,
  where,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { MatDialog } from '@angular/material/dialog';
import {
  StripePayments,
  Subscription,
} from '@stripe/firestore-stripe-payments';
import { collection, CollectionReference, Timestamp } from 'firebase/firestore';
import { Observable, of, switchMap, map, firstValueFrom } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';
import { environment } from 'src/environments/environment';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { BundleWithCredits, CreditBundle } from '../types';

export type CorrectSubscription = Subscription & {
  created: Timestamp;
  current_period_end: Timestamp;
};
export type StripeSubscription = CorrectSubscription;

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  payments: StripePayments;
  isSubscriptionDisabled = false;

  constructor(
    readonly app: FirebaseApp,
    private readonly zoomService: ZoomApiService,
    private readonly authService: AuthService,
    private readonly firestore: Firestore,
    private readonly functions: Functions,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public readonly config: AppConfig,
    private readonly confirmService: ConfirmDialogService
  ) {}

  async startSubscriptionToPremium(promotionCode?: string) {
    let user = await this.authService.getUser();

    if (!user || user?.isAnonymous) {
      const dialogRef = this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: user
            ? SignUpOrLoginIntent.LINK_ACCOUNT
            : SignUpOrLoginIntent.SIGN_IN,
          titleOverride:
            'Before you subscribe to Premium, please log in or create a permanent account',
        })
      );

      await firstValueFrom(dialogRef.afterClosed());
      user = await this.authService.getUser();

      if (!user || user?.isAnonymous) {
        return;
      }
    }

    if (this.config.runningIn === 'zoom') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content:
            'Signing up for a Premium subscription requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the signup flow.',
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        await this.zoomService.openUrl(
          `${window.location.origin}/join?flow=premium${
            promotionCode ? `&promotionCode=${promotionCode}` : ''
          }`,
          true
        );
      }

      return;
    }

    if (this.config.runningIn === 'teams') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content:
            'Signing up for a Premium subscription requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the signup flow.',
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        window.open(
          `${window.location.origin}/join?flow=premium${
            promotionCode ? `&promotionCode=${promotionCode}` : ''
          }`,
          '_blank'
        );
      }
      return;
    }

    const checkoutSessionsCollection = collection(
      this.firestore,
      'customers',
      user.uid,
      'checkout_sessions'
    );

    const sessionRef = await addDoc(checkoutSessionsCollection, {
      price: environment.premiumPriceId, // Premium plan
      automatic_tax: true,
      allow_promotion_codes: true,
      tax_id_collection: true,
      cancel_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=cancel`,
      mode: 'subscription',
      success_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=success`,
      trial_from_plan: true,
      promotion_code: promotionCode,
    });

    return new Promise((resolve, rejet) => {
      docData(sessionRef).subscribe((session) => {
        if (session.url) {
          window.location.assign(session.url);
          resolve(true);
        } else if (session.error?.message) {
          rejet(session.error.message);
        }
      });
    });
  }

  async isPremiumSubscriber() {
    const user = await this.authService.getUser();
    if (!user || user?.isAnonymous) {
      return false;
    }

    await this.authService.refreshIdToken();
    const claims = await this.authService.getCustomClaims();
    return claims?.stripeRole === 'premium';
  }

  async createPortalLink() {
    if (this.config.runningIn === 'zoom') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content:
            'Managing your subscription is only available on the web version of the app. You will now be redirected there, please sign in with the same account to manage this subscription.',
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        await this.zoomService.openUrl(
          `${window.location.origin}/join?flow=manageSubscription`,
          true
        );
      }
      return;
    }

    if (this.config.runningIn === 'teams') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content:
            'Managing your subscription is only available on the web version of the app. You will now be redirected there, please sign in with the same account to manage this subscription.',
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        window.open(
          `${window.location.origin}/join?flow=manageSubscription`,
          '_blank'
        );
      }
      return;
    }

    const result = await httpsCallable(
      this.functions,
      'ext-firestore-stripe-payments-createPortalLink'
    )({ returnUrl: window.location.href });
    window.location.assign((result.data as any).url);
  }

  getSubscription(): Observable<StripeSubscription | undefined> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user || user?.isAnonymous) {
          return of(undefined);
        }

        const collectionRef = collection(
          this.firestore,
          `customers/${user.uid}/subscriptions`
        ) as CollectionReference<StripeSubscription>;
        const q = query(
          collectionRef,
          where('status', 'in', ['trialing', 'active', 'past_due'])
        );
        return collectionData<StripeSubscription>(q).pipe(
          map((subscriptions) => {
            return subscriptions?.length ? subscriptions[0] : undefined;
          })
        );
      })
    );
  }

  async getAndAssignCreditBundles(): Promise<BundleWithCredits[]> {
    const result = await httpsCallable(
      this.functions,
      'getAllCreditsAndAssignWelcome'
    )();

    return (result.data as BundleWithCredits[]).map((bundle) => ({
      ...bundle,
      expiresAt: Timestamp.fromDate(new Date((bundle.expiresAt as any)._seconds * 1000)),
    }));
  }
}
