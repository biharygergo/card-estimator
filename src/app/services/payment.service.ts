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
import {
  Observable,
  of,
  switchMap,
  map,
  firstValueFrom,
} from 'rxjs';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';

export type StripeSubscription = Subscription;

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  payments: StripePayments;
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

    if (user?.isAnonymous) {
      const dialogRef = this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: SignUpOrLoginIntent.LINK_ACCOUNT,
          titleOverride:
            'Before you subscribe to Premium, please create a permanent account',
        })
      );

      await firstValueFrom(dialogRef.afterClosed());
      user = await this.authService.getUser();

      if (user?.isAnonymous) {
        return;
      }
    }

    if (this.config.isRunningInZoom) {
      if (
        confirm(
          'Signing up for a Premium subscription requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the signup flow.'
        )
      ) {
        this.zoomService.openUrl(`${window.location.origin}/join?flow=premium`);
        return;
      }
      return;
    }

    const session = await createCheckoutSession(this.payments, {
      price: 'price_1MhxFgCG1hllVHnccUeyTdNX', // Premium plan
      automatic_tax: true,
      allow_promotion_codes: true,
      tax_id_collection: true,
      cancel_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=cancel`,
      mode: 'subscription',
      success_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=success`,
      trial_from_plan: true,
      promotion_code: 'promo_1MjPfYCG1hllVHncKWqjTLxd'
    });
    window.location.assign(session.url);
  }

  async isPremiumSubscriber() {
    const user = await this.authService.getUser();
    if (user?.isAnonymous) {
      return false;
    }

    await this.authService.refreshIdToken();
    const claims = await this.authService.getCustomClaims();
    return claims?.stripeRole === 'premium';
  }

  createPortalLink() {
    return httpsCallable(
      this.functions,
      'ext-firestore-stripe-payments-createPortalLink'
    )({ returnUrl: window.location.href });
  }

  getSubscription(): Observable<Subscription | undefined> {
    return this.authService.user.pipe(
      switchMap((user) => {
        if (user?.isAnonymous) {
          return of(undefined);
        }

        const collectionRef = collection(
          this.firestore,
          `customers/${user.uid}/subscriptions`
        ) as CollectionReference<Subscription>;
        const q = query<Subscription>(
          collectionRef,
          where('status', 'in', ['trialing', 'active'])
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
