import { Inject, Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  collectionData,
  Firestore,
  query,
  where,
} from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { MatDialog } from '@angular/material/dialog';
import {
  getStripePayments,
  StripePayments,
  createCheckoutSession,
  Subscription,
} from '@stripe/firestore-stripe-payments';
import { collection, CollectionReference } from 'firebase/firestore';
import { Observable, of, switchMap, map, firstValueFrom } from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';
import { environment } from 'src/environments/environment';

export type StripeSubscription = Subscription;

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
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {
    this.payments = getStripePayments(app, {
      productsCollection: 'products',
      customersCollection: 'customers',
    });
  }

  async startSubscriptionToPremium() {
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
      /* if (
        confirm(
          'Signing up for a Premium subscription requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the signup flow.'
        )
      ) */
      await this.zoomService.openUrl(
        `${window.location.origin}/join?flow=premium`,
        true
      );
      return;
    }

    if (this.config.runningIn === 'teams') {
      window.open(`${window.location.origin}/join?flow=premium`, '_blank');
      return;
    }

    const session = await createCheckoutSession(this.payments, {
      price: environment.premiumPriceId, // Premium plan
      automatic_tax: true,
      allow_promotion_codes: true,
      tax_id_collection: true,
      cancel_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=cancel`,
      mode: 'subscription',
      success_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=success`,
      trial_from_plan: true,
      // promotion_code: 'promo_1MjPfYCG1hllVHncKWqjTLxd'
    });
    window.location.assign(session.url);
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
      /* if (
        confirm(
          'Managing your subscription is only available on the web version of the app. You will now be redirected there, please sign in with the same account to manage this subscription.'
        )
      ) { */
      await this.zoomService.openUrl(
        `${window.location.origin}/join?flow=manageSubscription`,
        true
      );
      return;
    }

    if (this.config.runningIn === 'teams') {
      /* if (
        confirm(
          'Managing your subscription is only available on the web version of the app. You will now be redirected there, please sign in with the same account to manage this subscription.'
        )
      ) { */
      window.open(
        `${window.location.origin}/join?flow=manageSubscription`,
        '_blank'
      );
      return;
    }

    const result = await httpsCallable(
      this.functions,
      'ext-firestore-stripe-payments-createPortalLink'
    )({ returnUrl: window.location.href });
    window.location.assign((result.data as any).url);
  }

  getSubscription(): Observable<Subscription | undefined> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (!user || user?.isAnonymous) {
          return of(undefined);
        }

        const collectionRef = collection(
          this.firestore,
          `customers/${user.uid}/subscriptions`
        ) as CollectionReference<Subscription>;
        const q = query<Subscription>(
          collectionRef,
          where('status', 'in', ['trialing', 'active', 'past_due'])
        );
        return collectionData<Subscription>(q).pipe(
          map((subscriptions) => {
            return subscriptions?.length ? subscriptions[0] : undefined;
          })
        );
      })
    );
  }
}
