import {getFirestore} from "firebase-admin/firestore";
import {MemberStatus, Room} from "../types";
import {
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change,
} from "firebase-functions/v2/firestore";

export const onRoomUpdated = async (
    change: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>
) => {
  const roomBefore = change.data?.before.data() as Room;
  const room = change.data?.after.data() as Room;
  if (!room) {
    return;
  }

  const isAutoRevealEnabled = room.isAutoRevealEnabled;
  if (isAutoRevealEnabled && !room.isAnonymousVotingEnabled) {
    console.log("Auto reveal enabled");
    await handleAutoReveal(room, roomBefore);
  }
};

const handleAutoReveal = async (room: Room, roomBefore: Room) => {
  const currentRoundId =
    room.currentRound ?? Object.keys(room.rounds).length - 1;
  const currentRound = room.rounds[currentRoundId];
  if (!currentRound) {
    return;
  }

  const activeMembers = room.members
      .filter(
          (member) =>
            member.status === MemberStatus.ACTIVE &&
        room.memberIds.includes(member.id)
      )
      .map((member) => member.id);
  const activeMembersBefore = roomBefore.members
      .filter(
          (member) =>
            member.status === MemberStatus.ACTIVE &&
        roomBefore.memberIds.includes(member.id)
      )
      .map((member) => member.id);

  const allVotesCastNow = activeMembers.every(
      (memberId) => !!currentRound.estimates[memberId]
  );
  const allVotesCastBefore = activeMembersBefore.every(
      (memberId) => !!roomBefore.rounds[currentRoundId]?.estimates[memberId]
  );

  if (allVotesCastNow && !allVotesCastBefore) {
    await getFirestore()
        .collection("rooms")
        .doc(room.roomId)
        .update({
          [`rounds.${currentRoundId}.show_results`]: true,
        });
  }
};
