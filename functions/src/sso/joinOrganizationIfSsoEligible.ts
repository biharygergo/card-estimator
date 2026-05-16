import {HttpsError} from "firebase-functions/v2/https";
import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {OrganizationRole} from "../types";

/**
 * Lets a user join an enterprise org when their email domain matches `ssoDomains`
 * and they have signed in with the configured SSO provider (SAML/OIDC).
 */
export async function joinOrganizationIfSsoEligible(
    userId: string,
    organizationId: string,
): Promise<{joined: boolean}> {
  const authUser = await getAuth().getUser(userId);
  const email = authUser.email;
  if (!email) {
    throw new HttpsError("failed-precondition", "Account has no email");
  }
  const domain = email.split("@").pop()?.toLowerCase();
  if (!domain) {
    throw new HttpsError("failed-precondition", "Invalid email");
  }

  const db = getFirestore();
  const ssoSnap = await db.doc(`ssoDomains/${domain}`).get();
  if (!ssoSnap.exists) {
    throw new HttpsError(
        "failed-precondition",
        "This email domain is not configured for enterprise SSO",
    );
  }
  const ssoData = ssoSnap.data() as {organizationId: string; providerId: string};
  if (ssoData.organizationId !== organizationId) {
    throw new HttpsError(
        "permission-denied",
        "Organization does not match your SSO email domain",
    );
  }

  const hasSsoProvider = authUser.providerData.some(
      (p) => p.providerId === ssoData.providerId,
  );
  if (!hasSsoProvider) {
    throw new HttpsError(
        "permission-denied",
        "Sign in with your organization SSO to join",
    );
  }

  const orgRef = db.doc(`organizations/${organizationId}`);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organization not found");
  }
  const orgData = orgSnap.data()!;
  const memberIds: string[] = orgData.memberIds || [];
  if (memberIds.includes(userId)) {
    return {joined: false};
  }

  await orgRef.update({
    memberIds: FieldValue.arrayUnion(userId),
    [`memberRoles.${userId}`]: OrganizationRole.MEMBER,
  });
  return {joined: true};
}
