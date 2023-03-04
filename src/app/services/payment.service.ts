import { Inject, Injectable } from '@angular/core';
import { FirebaseApp } from '@angular/fire/app';
import {
  getStripePayments,
  StripePayments,
  createCheckoutSession,
} from '@stripe/firestore-stripe-payments';
import { APP_CONFIG, AppConfig } from '../app-config.module';
import { AuthService } from './auth.service';
import { ZoomApiService } from './zoom-api.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  payments: StripePayments;
  constructor(
    readonly app: FirebaseApp,
    private readonly zoomService: ZoomApiService,
    private readonly authService: AuthService,
    @Inject(APP_CONFIG) public readonly config: AppConfig
  ) {
    this.payments = getStripePayments(app, {
      productsCollection: 'products',
      customersCollection: 'customers',
    });
  }

  async startSubscriptionToPremium() {
    if (this.config.isRunningInZoom) {
      this.zoomService.openUrl(`${window.location.origin}/join?flow=premium`);
      return;
    }

    const session = await createCheckoutSession(this.payments, {
      price: 'price_1MhxFgCG1hllVHnccUeyTdNX', // Premium plan
      automatic_tax: true,
      cancel_url: `${window.location.href}?subscriptionResult=cancel`,
      mode: 'subscription',
      success_url: `${window.location.href}?subscriptionResult=success`,
      trial_from_plan: true,
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
}
