import {getFirestore} from "firebase-admin/firestore";
import {UserPreference} from "../types";

export function getUserPreference(userId: string): Promise<UserPreference> {
  return getFirestore()
      .doc(`userPreferences/${userId}`)
      .get()
      .then((doc) => doc.data() as UserPreference);
}
