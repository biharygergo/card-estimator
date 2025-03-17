import { getFirestore } from 'firebase-admin/firestore';
import { Room } from '../types';
import {
  FirestoreEvent,
  QueryDocumentSnapshot,
  Change,
} from 'firebase-functions/v2/firestore';

export const onRoomUpdated = async (
  change: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined>
) => {
  const roomBefore = change.before.data() as Room;
  const room = change.after.data() as Room;
  if (!room) {
    return;
  }

  const isAutoRevealEnabled = room.isAutoRevealEnabled;
  if (isAutoRevealEnabled && !room.isAnonymousVotingEnabled) {
    await handleAutoReveal(room, roomBefore);
  }
};

const handleAutoReveal = async (room: Room, roomBefore: Room) => {
  const currentRoundId =
    room.currentRound ?? Object.keys(room.rounds).length - 1;
  const currentRound = room.rounds[currentRoundId];
  const allVotesCastNow = room.memberIds.every(
    (memberId) => currentRound.estimates[memberId] !== null
  );
  const allVotesCastBefore = roomBefore.memberIds.every(
    (memberId) => roomBefore.rounds[currentRoundId].estimates[memberId] !== null
  );

  if (allVotesCastNow && !allVotesCastBefore) {
    await getFirestore()
      .collection('rooms')
      .doc(room.roomId)
      .update({
        [`rounds.${currentRoundId}.show_results`]: true,
      });
  }
};
