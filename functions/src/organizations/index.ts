import {getFirestore} from "firebase-admin/firestore";
import {Organization} from "../types";

export async function getOrganizations(userId: string): Promise<Organization[]> {
  const orgs = await getFirestore()
      .collection("organizations")
      .where("memberIds", "array-contains", userId)
      .get();

  return orgs.docs.map((doc) => doc.data() as Organization);
}

export async function getCurrentOrganization(userId: string): Promise<Organization | undefined> {
  const orgs = await getOrganizations(userId);

  return orgs.at(0);
}
