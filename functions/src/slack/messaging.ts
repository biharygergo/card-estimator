import {PubSub} from "@google-cloud/pubsub";
import axios from "axios";
import {Room} from "../types";

export function createActionMessage(params: {
  text: string;
  action?: {
    label: string;
    url: string;
    id: string;
    value?: string;
  };

  responseType?: "ephemeral" | "in_channel";
}) {
  const {text, action, responseType = "ephemeral"} = params;
  return {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
      {
        type: "actions",
        elements: action ?
          [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: action.label,
                emoji: true,
              },
              url: action.url,
              action_id: action.id,
              value: action.value,
            },
          ] :
          [],
      },
    ],
    response_type: responseType,
  };
}

export interface CreateRoomPubSubMessage {
  userId: string;
  responseUrl: string;
  platformUserId: string;
}

export async function sendCreateRoomPubSubMessage(
    userId: string,
    slackUserId: string,
    responseUrl: string
) {
  const pubSub = new PubSub();
  const topicName = "create-room-from-messaging-integration";
  const data: CreateRoomPubSubMessage = {
    userId,
    responseUrl,
    platformUserId: slackUserId,
  };

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

export function sendRoomCreatedMessage(
    responseUrl: string,
    room: Room,
    createdBy: string,
) {
  return axios.post(
      responseUrl,
      createActionMessage({
        text: `*📣 New room created!*\nJoin the room with the button below and let's start planning together!\n\n*Room ID*: ${room.roomId}\n*Created by:* <@${createdBy}>`,
        action: {
          label: "🔗 Join Room",
          url: `https://planningpoker.live/room/${room.roomId}`,
          id: "join_room",
        },
        responseType: "in_channel",
      })
  );
}

export function sendOutOfCreditsMessage(responseUrl: string) {
  return axios
      .post(
          responseUrl,
          createActionMessage({
            text: "*🚨 Out of credits!*\nYou have run out of credits to create a room. Please top up your credits and try again.",
            action: {
              label: "Top Up Credits",
              url: "https://planningpoker.live/pricing",
              id: "top_up_credits",
            },
          })
      )
      .catch((error) => console.error(error));
}

export function sendGenericErrorMessage(
    responseUrl: string,
    errorMessage: string
) {
  return axios.post(
      responseUrl,
      createActionMessage({
        text: `🚨 An error occurred: ${errorMessage}`,
      })
  );
}
