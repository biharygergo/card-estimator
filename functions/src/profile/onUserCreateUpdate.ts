import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {Change} from "firebase-functions/v1";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";
import {addContact} from "../email";

const PROFILES_COLLECTION = "userProfiles";

// TODO: Keep these in sync with app
type UserProfile = {
  id: string;
  displayName: string;
  createdAt: Timestamp;
};

type UserDetails = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  createdAt: Timestamp;
};

export function createUserProfile(userDetails: UserDetails) {
  const userProfile: UserProfile = {
    id: userDetails.id,
    displayName: userDetails.displayName,
    createdAt: Timestamp.now(),
  };
  return getFirestore()
      .doc(`${PROFILES_COLLECTION}/${userProfile.id}`)
      .set(userProfile);
}

export async function onUserDetailsCreate(
    snap: DocumentSnapshot,
) {
  const userDetails = snap.data() as UserDetails;
  try {
    await addContact({email: userDetails.email, name: userDetails.displayName});
  } catch (e) {
    console.error("Error adding customer to mailing list", e);
  }
  return createUserProfile(userDetails);
}

export function onUserDetailsUpdate(change: Change<DocumentSnapshot>) {
  const updatedDetails = change.after.data() as UserDetails;
  const userProfile: Partial<UserProfile> = {
    displayName: updatedDetails.displayName,
  };
  return getFirestore()
      .doc(`${PROFILES_COLLECTION}/${updatedDetails.id}`)
      .update(userProfile);
}
