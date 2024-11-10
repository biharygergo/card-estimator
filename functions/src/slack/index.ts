import * as express from 'express';
import { isRunningInDevMode } from '../config';
import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { Room, SlackIntegration } from '../types';
import { getUserId } from '../jira/oauth';
import cookieParser = require('cookie-parser');
import * as qs from 'querystring';
import * as crypto from 'crypto';
import { PubSub } from '@google-cloud/pubsub';

export const slackMicroservice = express();
slackMicroservice.use(express.json());
slackMicroservice.use(cookieParser());

slackMicroservice.post(
  '/api/slack/commands/planning-poker',
  validateSlackRequest,
  async (req, res) => {
    const slackUserId = req.body.user_id as string;
    const teamId = req.body.team_id as string;

    const slackIntegration = await findSlackIntegrationBySlackUserId(
      slackUserId,
      teamId
    );
    if (!slackIntegration) {
      res.status(200).json(
        createActionMessage({
          text: "Looks like you haven't configured your PlanningPoker.live account for Slack yet. Click the button below to configure it.",
          actionLabel: 'Configure',
          actionUrl: 'https://planningpoker.live/integrations/slack',
        })
      );
      return;
    }

    await sendCreateRoomPubSubMessage(
      slackIntegration.userId,
      req.body.response_url
    );

    res.json({
      text: 'Hold tight, we are creating a room for you...',
      response_type: 'ephemeral',
    });
  }
);

slackMicroservice.get('/api/slack/install', async (req, res) => {
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send('Not signed in.');
  }

  res.redirect(getSlackAccessTokenRedirectUrl(req));
  return;
});

slackMicroservice.get('/api/slack/oauth-success', async (req, res) => {
  const code = req.query.code as string;
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send('Not signed in.');
    return;
  }

  const result = await getAccessToken(req, code);

  await saveSlackIntegration(
    userId,
    result.slackUserId,
    result.accessToken,
    result.teamId,
    result.teamName
  );

  res.redirect('https://planningpoker.live/integration/success');
});

function createActionMessage(params: {
  text: string;
  actionLabel: string;
  actionUrl: string;
  responseType?: 'ephemeral' | 'in_channel';
}) {
  const { text, actionLabel, actionUrl, responseType = 'ephemeral' } = params;
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text,
          emoji: true,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
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

async function sendCreateRoomPubSubMessage(
  userId: string,
  responseUrl: string
) {
  const pubSub = new PubSub();
  const topicName = 'create-room-from-slack';
  const data = { userId, responseUrl };

  const topic = await pubSub.topic(topicName).get({ autoCreate: true });

  return topic[0]
    .publishMessage({ json: data })
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
      text: `A new planning poker room has been created. Click the button below to join the room with id ${room.roomId}!`,
      actionLabel: 'Join room',
      actionUrl: `https://9ac1-80-99-77-114.ngrok-free.app/room/${room.roomId}`,
      responseType: 'in_channel',
    })
  );
}

export function sendOutOfCreditsMessage(responseUrl: string) {
  axios.post(
    responseUrl,
    createActionMessage({
      text: `🚨 You have no available credits to create a room. Please top up your credits and try again.`,
      actionLabel: 'Top up credits',
      actionUrl: `https://planningpoker.live/pricing`,
    })
  );
}

function getSlackConfig(req: express.Request) {
  const config = {
    clientId:
      (isRunningInDevMode(req)
        ? process.env.SLACK_CLIENT_ID_DEV
        : process.env.SLACK_CLIENT_ID) || '',
    clientSecret:
      (isRunningInDevMode(req)
        ? process.env.SLACK_CLIENT_SECRET_DEV
        : process.env.SLACK_CLIENT_SECRET) || '',
    redirectUri:
      (isRunningInDevMode(req)
        ? process.env.SLACK_REDIRECT_URL_DEV
        : process.env.SLACK_REDIRECT_URL) || '',
    signingSecret:
      (isRunningInDevMode(req)
        ? process.env.SLACK_SIGNING_SECRET_DEV
        : process.env.SLACK_SIGNING_SECRET) || '',
  };
  return config;
}

function getSlackAccessTokenRedirectUrl(request: express.Request): string {
  const config = getSlackConfig(request);
  return `https://slack.com/oauth/v2/authorize?scope=commands&client_id=${config.clientId}&redirect_uri=${config.redirectUri}`;
}

async function getAccessToken(
  request: express.Request,
  code: string
): Promise<{
  accessToken: string;
  teamId: string;
  slackUserId: string;
  teamName: string;
}> {
  const config = getSlackConfig(request);
  const url = 'https://slack.com/api/oauth.v2.access';
  const options = {
    method: 'POST',
    url,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: `code=${code}&client_id=${config.clientId}&client_secret=${config.clientSecret}&redirect_uri=${config.redirectUri}`,
  };
  const data = await axios(options).then((res) => res.data);

  return {
    accessToken: data.access_token,
    teamId: data.team.id,
    teamName: data.team.name,
    slackUserId: data.authed_user.id,
  };
}

async function getSlackIntegration(
  userId: string
): Promise<SlackIntegration | undefined> {
  const slackIntegrationRef = await getFirestore()
    .doc(`userDetails/${userId}/integrations/slack`)
    .get();

  if (!slackIntegrationRef.exists) {
    return undefined;
  }

  return slackIntegrationRef.data() as SlackIntegration;
}

async function findSlackIntegrationBySlackUserId(
  slackUserId: string,
  teamId: string
) {
  const slackIntegrationRef = await getFirestore()
    .collectionGroup('integrations')
    .where('slackUserId', '==', slackUserId)
    .get();

  if (slackIntegrationRef.empty) {
    return undefined;
  }

  const integration = slackIntegrationRef.docs[0].data() as SlackIntegration;

  if (
    !Object.values(integration.accessTokens).find(
      (token) => token.teamId === teamId
    )
  ) {
    return undefined;
  }

  return integration;
}

function validateSlackRequest(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const config = getSlackConfig(req);
  let slackSignature = req.headers['x-slack-signature'];
  let requestBody = qs.stringify(req.body);
  let timestamp = +(req.headers['x-slack-request-timestamp'] as string);
  let time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - timestamp) > 300) {
    return res.status(400).send('Ignore this request.');
  }
  if (!config.signingSecret) {
    return res.status(400).send('Slack signing secret is empty.');
  }
  let sigBasestring = 'v0:' + timestamp + ':' + requestBody;
  let mySignature =
    'v0=' +
    crypto
      .createHmac('sha256', config.signingSecret)
      .update(sigBasestring, 'utf8')
      .digest('hex');
  if (
    crypto.timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(slackSignature as string, 'utf8')
    )
  ) {
    next();
    return;
  } else {
    return res.status(400).send('Verification failed');
  }
}

async function saveSlackIntegration(
  userId: string,
  slackUserId: string,
  accessToken: string,
  teamId: string,
  teamName: string
) {
  const currentSlackIntegration = await getSlackIntegration(userId);
  if (currentSlackIntegration) {
    currentSlackIntegration.accessTokens[teamId] = {
      accessToken,
      teamId,
      teamName,
    };
    await getFirestore()
      .doc(`userDetails/${userId}/integrations/slack`)
      .set(currentSlackIntegration);
    return;
  }

  const slackIntegration: SlackIntegration = {
    provider: 'slack',
    userId,
    slackUserId,
    createdAt: Timestamp.now(),
    accessTokens: {
      [teamId]: { accessToken, teamId, teamName },
    },
  };

  await getFirestore()
    .doc(`userDetails/${userId}/integrations/slack`)
    .set(slackIntegration);
  return;
}
