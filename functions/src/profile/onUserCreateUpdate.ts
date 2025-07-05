import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {addContact, sendWelcomeEmail} from "../email";
import {FirestoreEvent, QueryDocumentSnapshot, Change} from "firebase-functions/v2/firestore";

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
    snap: FirestoreEvent<QueryDocumentSnapshot|undefined>,
) {
  const userDetails = snap.data?.data() as UserDetails;
  try {
    await addContact({email: userDetails.email, name: userDetails.displayName});
    await sendWelcomeEmail({email: userDetails.email, name: userDetails.displayName});
  } catch (e) {
    console.error("Error adding customer to mailing list", e);
  }
  return createUserProfile(userDetails);
}

export function onUserDetailsUpdate(change: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  const updatedDetails = change.data?.after.data() as UserDetails;
  const userProfile: Partial<UserProfile> = {
    displayName: updatedDetails.displayName,
  };
  return getFirestore()
      .doc(`${PROFILES_COLLECTION}/${updatedDetails.id}`)
      .update(userProfile);
}
