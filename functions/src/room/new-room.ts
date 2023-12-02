import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {
  Room,
  Member,
  CardSet,
  Round,
  RichTopic,
  SubscriptionMetadata,
  Organization,
} from "../../../src/app/types";
import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
  languages,
} from "unique-names-generator";
import {isPremiumSubscriber} from "../shared/customClaims";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import {
  assignWelcomeCreditsIfNeeded,
  getCreditForNewRoom,
  updateCreditUsage,
} from "../credits";

export async function createRoom(
    request: CallableRequest
): Promise<{ room: Room; member: Member }> {
  const member: Member = request.data.member;
  const recurringMeetingId: string | null = request.data.recurringMeetingId;
  if (!request.auth) {
    throw new HttpsError(
        "failed-precondition",
        "You are not authenticated. Please try again."
    );
  }
  const userId = request.auth.uid;
  const isPremium = await isPremiumSubscriber(userId);

  await assignWelcomeCreditsIfNeeded(userId);
  const creditToUse = await getCreditForNewRoom(userId);

  if (!creditToUse && !isPremium) {
    throw new HttpsError(
        "failed-precondition",
        "No available credits to create room",
        "error-no-credits"
    );
  }

  const customConfig: Config = {
    dictionaries: [adjectives, colors, animals, languages],
    separator: "-",
    length: 3,
    style: "lowerCase",
  };

  let roomId = uniqueNamesGenerator(customConfig).replace(" ", "-");

  while (await doesRoomAlreadyExist(roomId)) {
    roomId = uniqueNamesGenerator({...customConfig, length: 4}).replace(
        " ",
        "-"
    );
  }

  const subscriptionMetadata = await getSubscriptionMetadata(userId, creditToUse?.id);

  const room: Room = {
    id: createId(),
    roomId,
    members: [member],
    rounds: {0: createRound([member], 1)},
    currentRound: 0,
    isOpen: true,
    createdAt: Timestamp.now(),
    cardSet: CardSet.DEFAULT,
    createdById: userId,
    memberIds: [userId],
    subscriptionMetadata,
  };

  if (recurringMeetingId) {
    room.relatedRecurringMeetingLinkId = recurringMeetingId;
  }

  await getFirestore().collection("rooms").doc(room.roomId).set(room);

  if (!isPremium) {
    await updateCreditUsage(creditToUse!.id, userId, room.roomId);
  }

  return {room, member};
}

async function doesRoomAlreadyExist(roomId: string): Promise<boolean> {
  return getRoom(roomId)
      .then((room) => !!room)
      .catch(() => false);
}

async function getRoom(roomId: string): Promise<Room | undefined> {
  const room = await getFirestore().doc(`rooms/${roomId}`).get();
  return room.data() as Room | undefined;
}

function createRound(
    members: Member[],
    roundNumber: number,
    topic?: string,
    richTopic?: RichTopic
): Round {
  const round: Round = {
    id: createId(),
    topic: topic ?? `Topic of Round ${roundNumber}`,
    started_at: Timestamp.now() as any,
    finished_at: null,
    estimates: {},
    show_results: false,
    notes: {
      note: "",
      editedBy: null,
    },
  };

  if (richTopic) {
    round.richTopic = richTopic;
  }

  return round;
}

function createId(): string {
  return getFirestore().collection("rooms").doc().id;
}

async function getSubscriptionMetadata(
    userId: string,
    creditId: string | undefined
): Promise<SubscriptionMetadata> {
  const isPremium = await isPremiumSubscriber(userId);
  const myOrgs = await getFirestore()
      .collection("organizations")
      .where("memberIds", "array-contains", userId)
      .get();

  const organization = myOrgs.docs.length ?
    (myOrgs.docs[0].data() as Organization) :
    undefined;

  const subscriptionMetadata: SubscriptionMetadata = {
    createdWithPlan: isPremium ? "premium" : creditId ? "credit" : "basic",
    createdWithOrganization: organization ? organization.id : null,
  };

  return subscriptionMetadata;
}
