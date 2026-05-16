import {getAuth} from "firebase-admin/auth";
import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {OrganizationRole} from "../types";

export type UserDetails = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  createdAt: Timestamp;
};

/**
 * When a new user profile is created, add them to the org matching `ssoDomains`
 * if they authenticated with that org's SSO provider.
 */
export async function addSsoUserToOrganizationIfNeeded(
    userDetails: UserDetails,
): Promise<void> {
  const email = userDetails.email;
  if (!email || !email.includes("@")) {
    return;
  }
  const domain = email.split("@").pop()?.toLowerCase();
  if (!domain) {
    return;
  }

  const db = getFirestore();
  const ssoSnap = await db.doc(`ssoDomains/${domain}`).get();
  if (!ssoSnap.exists) {
    return;
  }
  const ssoData = ssoSnap.data() as {organizationId: string; providerId: string};
  const organizationId = ssoData.organizationId;

  let authUser;
  try {
    authUser = await getAuth().getUser(userDetails.id);
  } catch {
    console.warn("addSsoUserToOrganizationIfNeeded: no auth user", userDetails.id);
    return;
  }

  const hasSsoProvider = authUser.providerData.some(
      (p) => p.providerId === ssoData.providerId,
  );
  if (!hasSsoProvider) {
    return;
  }

  const orgRef = db.doc(`organizations/${organizationId}`);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    console.warn("addSsoUserToOrganizationIfNeeded: org missing", organizationId);
    return;
  }
  const orgData = orgSnap.data()!;
  const memberIds: string[] = orgData.memberIds || [];
  if (memberIds.includes(userDetails.id)) {
    return;
  }

  await orgRef.update({
    memberIds: FieldValue.arrayUnion(userDetails.id),
    [`memberRoles.${userDetails.id}`]: OrganizationRole.MEMBER,
  });
}
