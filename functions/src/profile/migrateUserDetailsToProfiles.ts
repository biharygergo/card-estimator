import {initializeApp} from "firebase-admin/app";
import {createUserProfile} from "./onUserCreateUpdate";
import {getFirestore} from "firebase-admin/firestore";

initializeApp({projectId: "card-estimator"});

async function migrateAllUserDetailsToProfiles() {
  const snapshot = await getFirestore().collection("userDetails").get();
  const promises: Promise<any>[] = [];
  snapshot.forEach((doc) => {
    promises.push(createUserProfile(doc.data() as any));
  });
  return Promise.all(promises);
}

migrateAllUserDetailsToProfiles().then(() =>
  console.log("Profile migration finished")
);
