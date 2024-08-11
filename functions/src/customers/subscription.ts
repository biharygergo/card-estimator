import {getFirestore} from "firebase-admin/firestore";
import {
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change,
} from "firebase-functions/v2/firestore";
import {BundleName} from "../types";
import {
  createBundle,
  createOrganizationCreditBundle,
} from "../credits";
import Stripe from "stripe";
import {getCurrentOrganization} from "../organizations";
import {captureError} from "../shared/errors";

export async function onCustomerPaymentCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const userId = snap.data?.ref.parent.parent?.id;

  if (!userId) {
    throw Error("No user id available");
  }

  const paymentIntent = snap.data?.data() as Stripe.PaymentIntent | undefined;

  if (paymentIntent?.status !== "succeeded") {
    console.error("Not successful payment");
    return;
  }

  const bundleName = paymentIntent.metadata?.bundleName as BundleName;

  if (
    !bundleName ||
    [
      BundleName.LARGE_BUNDLE,
      BundleName.MEGA_BUNDLE,
      BundleName.SMALL_BUNDLE,
      BundleName.ORGANIZATION_BUNDLE,
    ].includes(bundleName) === false
  ) {
    console.error("Unknown bundle name", bundleName);
    return;
  }

  console.log(paymentIntent);

  if (bundleName === BundleName.ORGANIZATION_BUNDLE) {
    await handleOrganizationBundleCreation(paymentIntent, userId);
  } else {
    await createBundle(bundleName, userId, paymentIntent.id);
  }
}

async function handleOrganizationBundleCreation(
    paymentIntent: Stripe.PaymentIntent,
    userId: string
) {
  const currentOrganization = await getCurrentOrganization(userId);
  const organizationId =
    paymentIntent.metadata["organizationId"] ?? currentOrganization?.id;

  const creditCount = paymentIntent.metadata["creditCount"];

  if (creditCount === undefined) {
    captureError(
        new Error(
            `No credit count defined for org credit purchase. User ID: ${userId}, Payment ID: ${paymentIntent.id}`
        )
    );
    return;
  }
  if (!organizationId) {
    captureError(
        new Error(
            `Organization could not be found after credit purchase! User ID: ${userId}, Payment ID: ${paymentIntent.id}`
        )
    );
    return;
  }

  await createOrganizationCreditBundle(
    organizationId!,
    Number(creditCount),
    userId,
    paymentIntent.id
  );
}

export async function onCustomerSubscriptionCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const userId = snap.data?.ref.parent.parent?.id;

  if (!userId) {
    throw Error("No user id available");
  }

  console.log("<Subscription created>", userId, snap.data?.data());
  return updateCreatedOrganizations(userId, "premium");
}

export async function onCustomerSubscriptionUpdated(
    change: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>
) {
  const updatedSubscriptionRef = change.data?.after;
  if (!updatedSubscriptionRef?.ref.parent.parent?.id) {
    throw Error("No user id available");
  }

  const customerId = updatedSubscriptionRef.ref.parent.parent.id;
  console.log("<Subscription updated>", customerId, change.data?.after.data());

  const activeSubscriptions = await getFirestore()
      .collection(`customers/${customerId}/subscriptions`)
      .where("status", "in", ["trialing", "active"])
      .get();

  const updateToPlan = activeSubscriptions.empty ? "basic" : "premium";

  return updateCreatedOrganizations(customerId, updateToPlan);
}

async function updateCreatedOrganizations(
    userId: string,
    updateToPlan: string
) {
  const organizations = await getFirestore()
      .collection("organizations")
      .where("createdById", "==", userId)
      .get();

  console.log("<Updating organizations>");

  await Promise.all(
      organizations.docs
          .map((doc) => doc.data())
          .map((organization) => {
            console.log(
                "<Updating organization> To Plan:",
                updateToPlan,
                organization
            );
            return getFirestore()
                .doc(`organizations/${organization.id}`)
                .update({activePlan: updateToPlan});
          })
  );
}
