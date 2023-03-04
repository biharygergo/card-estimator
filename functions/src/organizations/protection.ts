import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { Change } from 'firebase-functions/v1';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';

export async function onOrganizationUpdated(change: Change<DocumentSnapshot>) {
  const beforeOrg = change.before.data();
  const afterOrg = change.after.data();

  if (
    beforeOrg &&
    afterOrg &&
    JSON.stringify(beforeOrg?.memberIds) !== JSON.stringify(afterOrg?.memberIds)
  ) {
    const removedMembers = beforeOrg.memberIds.filter(
      (id: string) => afterOrg.memberIds.indexOf(id) < 0
    );

    console.log('removed', removedMembers);

    const roomIdsWithProtection = await getFirestore()
      .collectionGroup('metadata')
      .where('organizationProtection', '==', change.after.id)
      .get()
      .then((snapshot) =>
        snapshot.docs.map((doc) => doc.ref.parent.parent?.id)
      );

    if (removedMembers?.length) {
      const memberId = removedMembers[0];
      await Promise.all(
        roomIdsWithProtection.map((roomId) => {
          console.log('removing', memberId, roomId);
          return getFirestore()
            .doc(`rooms/${roomId}`)
            .update({ memberIds: FieldValue.arrayRemove(memberId) });
        })
      );
    }

    console.log(roomIdsWithProtection);
  }
}
