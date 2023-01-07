import {firestore} from "firebase-admin";
import {Change, EventContext} from "firebase-functions/v1";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";

const PROFILES_COLLECTION = "userProfiles";

// TODO: Keep these in sync with app
type UserProfile = {
  id: string;
  displayName: string;
  createdAt: firestore.Timestamp;
};

type UserDetails = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  email: string;
  createdAt: firestore.Timestamp;
};

export function createUserProfile(userDetails: UserDetails) {
  const userProfile: UserProfile = {
    id: userDetails.id,
    displayName: userDetails.displayName,
    createdAt: firestore.Timestamp.now(),
  };
  return firestore()
      .doc(`${PROFILES_COLLECTION}/${userProfile.id}`)
      .set(userProfile);
}

export function onUserDetailsCreate(
    snap: DocumentSnapshot,
    context: EventContext
) {
  const userDetails = snap.data() as UserDetails;
  return createUserProfile(userDetails);
}

export function onUserDetailsUpdate(change: Change<DocumentSnapshot>) {
  const updatedDetails = change.after.data() as UserDetails;
  const userProfile: Partial<UserProfile> = {
    displayName: updatedDetails.displayName,
  };
  return firestore()
      .doc(`${PROFILES_COLLECTION}/${updatedDetails.id}`)
      .update(userProfile);
}
