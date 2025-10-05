import {FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {getAuth} from "firebase-admin/auth";
import {Organization} from "../types";
import {sendOrganizationWelcomeEmail} from "../email";

export async function onOrganizationCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot|undefined>
) {
  const organization = snap.data?.data() as Organization;

  if (!organization) {
    console.error("No organization data found");
    return;
  }

  console.log(`Organization created: ${organization.name} (${organization.id})`);

  try {
    // Fetch the creator's user details from Firebase Auth
    const creatorUser = await getAuth().getUser(organization.createdById);

    if (!creatorUser.email) {
      console.error(`Creator user ${organization.createdById} has no email address`);
      return;
    }

    console.log(`Sending organization welcome email to: ${creatorUser.email}`);

    // Send the organization welcome email
    await sendOrganizationWelcomeEmail({
      email: creatorUser.email,
      organizationName: organization.name,
    });

    console.log(`Organization welcome email sent successfully to ${creatorUser.email}`);
  } catch (error) {
    console.error("Error sending organization welcome email:", error);
    // Don't throw - we don't want to fail the organization creation if email fails
  }
}
