import {getFirestore} from "firebase-admin/firestore";
import {Organization} from "../types";
import {getUserPreference} from "../shared/users";

export async function getOrganizations(userId: string): Promise<Organization[]> {
  const orgs = await getFirestore()
      .collection("organizations")
      .where("memberIds", "array-contains", userId)
      .get();

  return orgs.docs.map((doc) => doc.data() as Organization);
}

export async function getCurrentOrganization(userId: string): Promise<Organization | undefined> {
  const orgs = await getOrganizations(userId);
  const userPreference = await getUserPreference(userId);

  const selectedOrg = orgs.find((org) => org.id === userPreference?.activeOrganizationId);
  return selectedOrg ?? orgs.at(0);
}
