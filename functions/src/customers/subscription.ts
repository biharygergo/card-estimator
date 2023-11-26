import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import {Change} from "firebase-functions/v1";

export async function onCustomerSubscriptionCreated(
    snap: DocumentSnapshot,
) {
  const userId = snap.ref.parent.parent?.id;

  if (!userId) {
    throw Error("No user id available");
  }

  console.log("<Subscription created>", userId, snap.data());
  return updateCreatedOrganizations(userId, "premium");
}

export async function onCustomerSubscriptionUpdated(
    change: Change<DocumentSnapshot>
) {
  const updatedSubscriptionRef = change.after;
  if (!updatedSubscriptionRef.ref.parent.parent?.id) {
    throw Error("No user id available");
  }

  const customerId = updatedSubscriptionRef.ref.parent.parent.id;
  console.log("<Subscription updated>", customerId, change.after.data());

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
