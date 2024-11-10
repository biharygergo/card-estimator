import {PubSub} from "@google-cloud/pubsub";
import axios from "axios";
import {Room} from "../types";

export function createActionMessage(params: {
  text: string;
  actionLabel: string;
  actionUrl: string;
  responseType?: "ephemeral" | "in_channel";
}) {
  const {text, actionLabel, actionUrl, responseType = "ephemeral"} = params;
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text,
          emoji: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: actionLabel,
              emoji: true,
            },
            url: actionUrl,
          },
        ],
      },
    ],
    response_type: responseType,
  };
}

export async function sendCreateRoomPubSubMessage(
    userId: string,
    responseUrl: string
) {
  const pubSub = new PubSub();
  const topicName = "create-room-from-slack";
  const data = {userId, responseUrl};

  const topic = await pubSub.topic(topicName).get({autoCreate: true});

  return topic[0]
      .publishMessage({json: data})
      .then((messageId) => {
        console.log(`Message ${messageId} published.`);
      })
      .catch((error) => {
        console.error(`Received error while publishing: ${error.message}`);
      });
}

export function sendRoomCreatedMessage(responseUrl: string, room: Room) {
  axios.post(
      responseUrl,
      createActionMessage({
        text: `A new planning poker room has been created. Click the button below to join the room with ID ${room.roomId}.`,
        actionLabel: "Join Room",
        actionUrl: `https://planningpoker.live/room/${room.roomId}`,
        responseType: "in_channel",
      })
  );
}

export function sendOutOfCreditsMessage(responseUrl: string) {
  axios.post(
      responseUrl,
      createActionMessage({
        text: "🚨 You have run out of credits to create a room. Please top up your credits and try again.",
        actionLabel: "Top Up Credits",
        actionUrl: "https://planningpoker.live/pricing",
      })
  );
}
