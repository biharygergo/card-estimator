import {getFirestore} from "firebase-admin/firestore";
import {FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";

export async function onRoomCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot|undefined>,
) {
  const roomData = snap.data?.data();

  if (roomData?.relatedRecurringMeetingLinkId) {
    await getFirestore()
        .collection("recurringMeetingLinks")
        .doc(roomData?.relatedRecurringMeetingLinkId)
        .collection("createdRooms")
        .doc(roomData.roomId)
        .set({createdAt: roomData.createdAt, roomId: roomData.roomId});
  }
}
