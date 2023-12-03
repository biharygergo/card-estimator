import {getFirestore} from "firebase-admin/firestore";
import {
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change,
} from "firebase-functions/v2/firestore";
import {BundleName} from "../types";
import {createBundle} from "../credits";

export async function onCustomerPaymentCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const userId = snap.data?.ref.parent.parent?.id;

  if (!userId) {
    throw Error("No user id available");
  }

  const bundleName = snap.data?.data().metadata?.bundleName;

  if (
    !bundleName ||
    [
      BundleName.LARGE_BUNDLE,
      BundleName.MEGA_BUNDLE,
      BundleName.SMALL_BUNDLE,
    ].includes(bundleName) === false
  ) {
    console.error('Unknown bundle name', bundleName);
    return;
  }

  console.log(bundleName, userId, snap.data?.data().id);
  await createBundle(bundleName, userId, snap.data?.data().id, true);
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
