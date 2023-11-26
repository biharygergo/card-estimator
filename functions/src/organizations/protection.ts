import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {FirestoreEvent, QueryDocumentSnapshot, Change} from "firebase-functions/v2/firestore";

export async function onOrganizationUpdated(change: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>) {
  const beforeOrg = change.data?.before.data();
  const afterOrg = change.data?.after.data();

  if (
    beforeOrg &&
    afterOrg &&
    JSON.stringify(beforeOrg?.memberIds) !== JSON.stringify(afterOrg?.memberIds)
  ) {
    const removedMembers = beforeOrg.memberIds.filter(
        (id: string) => afterOrg.memberIds.indexOf(id) < 0
    );

    console.log("removed", removedMembers);

    const roomIdsWithProtection = await getFirestore()
        .collectionGroup("metadata")
        .where("organizationProtection", "==", change.data!.after.id)
        .get()
        .then((snapshot) =>
          snapshot.docs.map((doc) => doc.ref.parent.parent?.id)
        );

    if (removedMembers?.length) {
      const memberId = removedMembers[0];
      await Promise.all(
          roomIdsWithProtection.map((roomId) => {
            console.log("removing", memberId, roomId);
            return getFirestore()
                .doc(`rooms/${roomId}`)
                .update({memberIds: FieldValue.arrayRemove(memberId)});
          })
      );
    }

    console.log(roomIdsWithProtection);
  }
}
