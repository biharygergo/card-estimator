import {initializeApp} from "firebase-admin/app";
import {firestore} from "firebase-admin";
import {createUserProfile} from "./onUserCreateUpdate";

initializeApp({projectId: "card-estimator"});

async function migrateAllUserDetailsToProfiles() {
  const snapshot = await firestore().collection("userDetails").get();
  const promises: Promise<any>[] = [];
  snapshot.forEach((doc) => {
    promises.push(createUserProfile(doc.data() as any));
  });
  return Promise.all(promises);
}

migrateAllUserDetailsToProfiles().then(() =>
  console.log("Profile migration finished")
);
