import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";
import {EventContext} from "firebase-functions";

export async function onRoomCreated(
    snap: DocumentSnapshot,
    context: EventContext
) {
  const roomData = snap.data();

  if (roomData?.relatedRecurringMeetingLinkId) {
    await getFirestore()
        .collection("recurringMeetingLinks")
        .doc(roomData?.relatedRecurringMeetingLinkId)
        .collection("createdRooms")
        .doc(roomData.roomId)
        .set({createdAt: roomData.createdAt, roomId: roomData.roomId});
  }
}
