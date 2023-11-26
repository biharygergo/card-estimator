import {DocumentSnapshot, getFirestore} from "firebase-admin/firestore";

export async function onRoomCreated(
    snap: DocumentSnapshot,
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
