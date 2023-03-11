import * as functions from "firebase-functions";
import {hash, compare} from "bcrypt";
import {getFirestore} from "firebase-admin/firestore";
import {CallableContext} from "firebase-functions/v1/https";
import {getCustomClaims, RoomAccessValue} from "../shared/customClaims";

const ROOMS_COLLECTION = "rooms";

async function hashPassword(plaintextPassword: string) {
  const hashResult = await hash(plaintextPassword, 10);
  return hashResult;
}

async function comparePassword(plaintextPassword: string, hash: string) {
  const result = await compare(plaintextPassword, hash);
  return result;
}

async function setRoomAccessCustomClaims(
    userId: string,
    roomId: string,
    hash: string
) {
  const accessList = await getFirestore()
      .collection(ROOMS_COLLECTION)
      .doc(roomId)
      .collection("metadata")
      .doc("passwordProtection")
      .collection("accessList");

  const roomAccess: RoomAccessValue = {
    hash,
    roomId,
  };

  await accessList.doc(userId).set(roomAccess);
}

export async function setRoomPassword(data: any, context: CallableContext) {
  const {password, roomId} = data;
  const roomDoc = await getFirestore().collection(ROOMS_COLLECTION).doc(roomId);

  const room = await roomDoc.get().then((snapshot) => snapshot.data());

  const userId = context.auth?.uid;

  // Validate that the user can set a password on this room
  if (
    !userId ||
    room?.createdById !== userId ||
    (await getCustomClaims(userId)).stripeRole !== "premium"
  ) {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Not authorized to set a password on this room."
    );
  }

  const passwordHash = await hashPassword(password);

  await roomDoc
      .collection("metadata")
      .doc("passwordProtection")
      .set({value: passwordHash});

  // Update the user's custom claims
  await setRoomAccessCustomClaims(userId, roomId, passwordHash);

  await roomDoc.update({memberIds: [userId]});

  return {success: true};
}

export async function enterProtectedRoom(data: any, context: CallableContext) {
  const {roomId, password} = data;
  const roomDoc = await getFirestore().collection(ROOMS_COLLECTION).doc(roomId);

  const room = await roomDoc.get().then((snapshot) => snapshot.data());

  if (!room) {
    throw new functions.https.HttpsError("not-found", "Room not found");
  }

  if (!context.auth?.uid) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to continue."
    );
  }

  const roomPasswordHash = await roomDoc
      .collection("metadata")
      .doc("passwordProtection")
      .get()
      .then((snap) => snap.data()?.value);

  if (!roomPasswordHash) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "This room is not password protected"
    );
  }

  const isMatch = await comparePassword(password, roomPasswordHash);

  if (!isMatch) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Invalid password."
    );
  }

  // Update the user's custom claims
  await setRoomAccessCustomClaims(context.auth.uid, roomId, roomPasswordHash);

  return {success: true};
}
