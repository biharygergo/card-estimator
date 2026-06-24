import { Inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  CollectionReference,
  collection,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { firestore, functions } from '../firebase/firebase';
import { collectionData, docData } from '../firebase/firestore-rx';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of, switchMap, map, firstValueFrom } from 'rxjs';
import { StripeSubscription } from '../types/stripe-subscription';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import {
  signUpOrLoginDialogCreator,
  SignUpOrLoginIntent,
} from '../shared/sign-up-or-login-dialog/sign-up-or-login-dialog.component';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';
import { environment } from 'src/environments/environment';
import { ConfirmDialogService } from '../shared/confirm-dialog/confirm-dialog.service';
import { BundleName, BundleWithCredits, Credit, CreditBundle } from '../types';

export type { StripeSubscription } from '../types/stripe-subscription';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  isSubscriptionDisabled = signal<boolean>(false);

  constructor(
    private readonly zoomService: ZoomApiService,
    private readonly authService: AuthService,
    private readonly dialog: MatDialog,
    @Inject(APP_CONFIG) public readonly config: AppConfig,
    private readonly confirmService: ConfirmDialogService
  ) {}

  private getPriceIdForBundle(bundleName: BundleName, currency: 'eur' | 'usd', creditCount?: number) {
    switch (bundleName) {
      case BundleName.SMALL_BUNDLE:
        return currency === 'eur'
          ? environment.smallBundlePriceId
          : environment.smallBundlePriceIdUsd;
      case BundleName.LARGE_BUNDLE:
        return currency === 'eur'
          ? environment.largeBundlePriceId
          : environment.largeBundlePriceIdUsd;
      case BundleName.MEGA_BUNDLE:
        return currency === 'eur'
          ? environment.megaBundlePriceId
          : environment.megaBundlePriceIdUsd;
      case BundleName.ORGANIZATION_BUNDLE:
        if (creditCount === 25) {
          return currency === 'eur'
            ? environment.orgBundleSmallestPriceId
            : environment.orgBundleSmallestPriceIdUsd;
        }
        if (creditCount === 75) {
          return currency === 'eur'
            ? environment.orgBundleSmallPriceId
            : environment.orgBundleSmallPriceIdUsd;
        }
        if (creditCount === 150) {
          return currency === 'eur'
            ? environment.orgBundlePriceId
            : environment.orgBundlePriceIdUsd;
        }
        if (creditCount === 300) {
          return currency === 'eur'
            ? environment.orgBundleLargestPriceId
            : environment.orgBundleLargestPriceIdUsd;
        }
      default:
        throw new Error(`No price id for ${bundleName}.`);
    }
  }
  async buyBundle(
    bundleName: BundleName,
    currency: 'eur' | 'usd',
    organizationId?: string,
    creditCount?: number
  ) {
    const passes = await this.checkPrerequisites(
      'Before you buy a bundle, please log in or create a permanent account',
      'Purchasing a bundle requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the purchase flow.'
    );
    let user = await this.authService.getUser();

    if (!passes) return;

    const checkoutSessionsCollection = collection(
      firestore,
      'customers',
      user.uid,
      'checkout_sessions'
    );

    const checkoutDoc = {
      line_items: [
        {
          price: this.getPriceIdForBundle(bundleName, currency, creditCount),
          quantity: creditCount ?? 1,
        },
      ],
      automatic_tax: true,
      allow_promotion_codes: true,
      tax_id_collection: true,
      cancel_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=cancel`,
      mode: 'payment',
      success_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=success`,
      metadata: {
        bundleName,
      },
    };

    if (organizationId) {
      checkoutDoc.metadata['organizationId'] = organizationId;
    }

    if (creditCount) {
      checkoutDoc.metadata['creditCount'] = creditCount;
    }

    const sessionRef = await addDoc(checkoutSessionsCollection, checkoutDoc);

    return new Promise((resolve, reject) => {
      docData(sessionRef).subscribe(session => {
        if (session.url) {
          window.location.assign(session.url);
          resolve(true);
        } else if (session.error?.message) {
          reject(session.error.message);
        }
      });
    });
  }

  private async checkPrerequisites(
    authModalTitle: string,
    embeddedAppModalContent: string
  ): Promise<boolean> {
    let user = await this.authService.getUser();

    if (!user || user?.isAnonymous) {
      const dialogRef = this.dialog.open(
        ...signUpOrLoginDialogCreator({
          intent: user
            ? SignUpOrLoginIntent.LINK_ACCOUNT
            : SignUpOrLoginIntent.SIGN_IN,
          titleOverride: authModalTitle,
        })
      );

      await firstValueFrom(dialogRef.afterClosed());
      user = await this.authService.getUser();

      if (!user || user?.isAnonymous) {
        return false;
      }
    }

    if (this.config.runningIn === 'zoom') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content: embeddedAppModalContent,
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        await this.zoomService.openUrl(
          `${window.location.origin}/join?flow=premium`,
          true
        );
      }

      return false;
    }

    if (this.config.runningIn === 'teams') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content: embeddedAppModalContent,
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        window.open(`${window.location.origin}/join?flow=premium`, '_blank');
      }
      return false;
    }

    if (this.config.runningIn === 'meet') {
      if (
        await this.confirmService.openConfirmationDialog({
          title: 'Finish on planningpoker.live',
          content: embeddedAppModalContent,
          positiveText: 'Sounds good',
          negativeText: 'Cancel',
        })
      ) {
        window.open(`${window.location.origin}/join?flow=premium`, '_blank');
      }
      return false;
    }

    return true;
  }

  async startSubscriptionToPremium(
    currency: 'usd' | 'eur',
    promotionCode?: string
  ) {
    const passes = await this.checkPrerequisites(
      'Before you subscribe to Premium, please log in or create a permanent account',
      'Signing up for a Premium subscription requires you to open Planning Poker in your browser. You will now be redirected to planningpoker.live where you can finish the signup flow.'
    );

    const user = await this.authService.getUser();

    if (!passes) return;

    const checkoutSessionsCollection = collection(
      firestore,
      'customers',
      user.uid,
      'checkout_sessions'
    );

    const sessionRef = await addDoc(checkoutSessionsCollection, {
      price:
        currency === 'eur'
          ? environment.premiumPriceId
          : environment.premiumPriceIdUsd, // Premium plan
      automatic_tax: true,
      allow_promotion_codes: true,
      tax_id_collection: true,
      cancel_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=cancel`,
      mode: 'subscription',
      success_url: `${window.location.origin}${window.location.pathname}?subscriptionResult=success`,
      trial_from_plan: false,
    });

    return new Promise((resolve, reject) => {
      docData(sessionRef).subscribe(session => {
        if (session.url) {
          window.location.assign(session.url);
          resolve(true);
        } else if (session.error?.message) {
          reject(session.error.message);
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
      functions,
      'ext-firestore-stripe-payments-createPortalLink'
    )({ returnUrl: window.location.href });
    window.location.assign((result.data as any).url);
  }

  getSubscription(): Observable<StripeSubscription | undefined> {
    return this.authService.user.pipe(
      switchMap(user => {
        if (!user || user?.isAnonymous) {
          return of(undefined);
        }

        const collectionRef = collection(
          firestore,
          `customers/${user.uid}/subscriptions`
        ) as CollectionReference<StripeSubscription>;
        const q = query(
          collectionRef,
          where('status', 'in', ['trialing', 'active', 'past_due'])
        );
        return collectionData<StripeSubscription>(q).pipe(
          map(subscriptions => {
            return subscriptions?.length ? subscriptions[0] : undefined;
          })
        );
      })
    );
  }

  async getAndAssignCreditBundles(): Promise<{
    availableCredits: Credit[];
    credits: Credit[];
    bundles: BundleWithCredits[];
  }> {
    const result = await httpsCallable(
      functions,
      'getAllCreditsAndAssignWelcome'
    )();

    const bundles = ((result.data as any).bundles as BundleWithCredits[]).map(
      bundle => ({
        ...bundle,
        expiresAt: bundle.expiresAt
          ? Timestamp.fromDate(
              new Date((bundle.expiresAt as any)._seconds * 1000)
            )
          : null,
      })
    );

    const credits = ((result.data as any).credits as Credit[]).map(credit => ({
      ...credit,
      expiresAt: credit.expiresAt
        ? Timestamp.fromDate(
            new Date((credit.expiresAt as any)._seconds * 1000)
          )
        : null,
    }));

    const availableCredits = credits.filter(
      c =>
        !c.usedForRoomId &&
        (!c.expiresAt || c.expiresAt.toDate().getTime() > Date.now())
    );

    return { credits, bundles, availableCredits };
  }
}
