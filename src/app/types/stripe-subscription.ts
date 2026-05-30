import { Timestamp } from 'firebase/firestore';

/** Plan object nested on subscription items from the Stripe extension. */
export interface StripeSubscriptionPlan {
  amount?: number;
  currency?: string;
  interval?: string;
}

export interface StripeSubscriptionItem {
  plan?: StripeSubscriptionPlan;
}

/**
 * Document shape under `customers/{uid}/subscriptions/{id}` as written by the
 * firestore-stripe-payments Firebase Extension.
 */
export interface StripeSubscription {
  status: string;
  created: Timestamp;
  current_period_end: Timestamp;
  cancel_at_period_end?: boolean;
  items?: StripeSubscriptionItem[];
}
