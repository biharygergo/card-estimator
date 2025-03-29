import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {
  Room,
  Member,
  CardSet,
  Round,
  RichTopic,
  SubscriptionMetadata,
  Credit,
  MemberType,
  MemberStatus,
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
  assignCreditsAsNeeded,
  getCreditForNewRoom,
} from "../credits";
import {getCurrentOrganization} from "../organizations";
import {getAuth} from "firebase-admin/auth";
import {
  CreateRoomPubSubMessage,
  sendGenericErrorMessage,
  sendOutOfCreditsMessage,
  sendRoomCreatedMessage,
} from "../slack/messaging";
import {PubSub} from "@google-cloud/pubsub";

export interface UpdateCreditUsagePubSubMessage {
  credit: Credit;
  userId: string;
  roomId: string;
}

async function sendUpdateCreditUsagePubSubMessage(
    credit: Credit,
    userId: string,
    roomId: string
) {
  const pubSub = new PubSub();
  const topicName = "update-credit-usage";
  const data: UpdateCreditUsagePubSubMessage = {
    credit,
    userId,
    roomId,
  };

  const topic = await pubSub.topic(topicName).get({autoCreate: true});

  return topic[0]
      .publishMessage({json: data})
      .then((messageId) => {
        console.log(`Credit update message ${messageId} published.`);
      })
      .catch((error) => {
        console.error(`Received error while publishing credit update: ${error.message}`);
      });
}

export async function createRoomFromSlack(data: CreateRoomPubSubMessage) {
  const {userId, responseUrl} = data;
  const user = await getAuth().getUser(userId);
  const member: Member = {
    id: userId,
    name: user.displayName!,
    platform: "web",
    avatarUrl: user.photoURL,
    type: MemberType.ESTIMATOR,
    status: MemberStatus.ACTIVE,
  };

  try {
    const createResult = await createRoomInternal({
      userId,
      member,
    });
    await sendRoomCreatedMessage(
        responseUrl,
        createResult.room,
        data.platformUserId
    );
  } catch (error) {
    console.error(error);
    console.error("Error creating room from Slack");
    if (error instanceof OutOfCreditsError) {
      await sendOutOfCreditsMessage(responseUrl);
      return;
    }
    await sendGenericErrorMessage(responseUrl, (error as any).message);
  }
}

export async function createRoom(
    request: CallableRequest
): Promise<{ room: Room; member: Member }> {
  const member: Member = request.data.member;
  const recurringMeetingId = request.data.recurringMeetingId;

  if (!request.auth) {
    throw new HttpsError(
        "failed-precondition",
        "You are not authenticated. Please try again."
    );
  }

  return createRoomInternal({
    userId: request.auth.uid,
    member,
    recurringMeetingId,
  }).catch((error) => {
    if (error instanceof OutOfCreditsError) {
      throw new HttpsError(
          "failed-precondition",
          "No available credits to create room",
          "error-no-credits"
      );
    }

    throw error;
  });
}

class OutOfCreditsError extends Error {
  constructor() {
    super("No available credits to create room");
    this.name = "OutOfCreditsError";
  }
}

async function createRoomInternal(params: {
  userId: string;
  member: Member;
  recurringMeetingId?: string;
}) {
  const {userId, member, recurringMeetingId} = params;

  // Run credit check and room ID generation in parallel
  const [isPremium, creditToUse] = await Promise.all([
    isPremiumSubscriber(userId),
    assignCreditsAsNeeded(userId).then(() => getCreditForNewRoom(userId)),
  ]);

  if (!creditToUse && !isPremium) {
    throw new OutOfCreditsError();
  }

  const customConfig: Config = {
    dictionaries: [adjectives, colors, animals, languages],
    separator: "-",
    length: 3,
    style: "lowerCase",
  };

  let roomId = uniqueNamesGenerator(customConfig).replace(" ", "-");

  while (await doesRoomAlreadyExist(roomId)) {
    roomId = uniqueNamesGenerator(customConfig).replace(" ", "-");
  }

  // Get organization first since it's needed for subscription metadata
  const organization = await getCurrentOrganization(userId);
  const subscriptionMetadata = await getSubscriptionMetadata(
      userId,
      creditToUse,
      isPremium,
      organization
  );

  const room: Room = {
    id: createId(),
    roomId,
    members: [member],
    rounds: {0: createRound(1)},
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
    await sendUpdateCreditUsagePubSubMessage(creditToUse!, userId, room.roomId);
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
    credit: Credit | undefined,
    isPremium: boolean,
    organization: Organization | undefined
): Promise<SubscriptionMetadata> {
  const subscriptionMetadata: SubscriptionMetadata = {
    createdWithPlan: isPremium ?
      "premium" :
      credit ?
      credit.isPaidCredit ?
        "paid-credit" :
        "credit" :
      "basic",
    createdWithOrganization: organization ? organization.id : null,
  };

  return subscriptionMetadata;
}
