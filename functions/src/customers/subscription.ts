import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import {Change, EventContext} from "firebase-functions/v1";

export async function onCustomerSubscriptionCreated(
    snap: DocumentSnapshot,
    context: EventContext
) {
  if (!snap.ref.parent.parent?.id) {
    throw Error("No user id available");
  }

  return updateCreatedOrganizations(snap.ref.parent.parent?.id, "premium");
}

export async function onCustomerSubscriptionUpdated(
    change: Change<DocumentSnapshot>
) {
  const updatedSubscriptionRef = change.after;
  if (!updatedSubscriptionRef.ref.parent.parent?.id) {
    throw Error("No user id available");
  }

  const customerId = updatedSubscriptionRef.ref.parent.parent.id;

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

  await Promise.all(
      organizations.docs
          .map((doc) => doc.data())
          .map((organization) => {
            return getFirestore()
                .doc(`organizations/${organization.id}`)
                .update({activePlan: updateToPlan});
          })
  );
}
