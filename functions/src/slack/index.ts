import * as express from 'express';
import { isRunningInDevMode } from '../config';
import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { SlackIntegration } from '../types';
import { getUserId } from '../jira/oauth';
import cookieParser = require('cookie-parser');

export const slackMicroservice = express();
slackMicroservice.use(express.json());
slackMicroservice.use(cookieParser());

slackMicroservice.post(
  '/api/slack/commands/planning-poker',
  async (req, res) => {
    // const token = req.query.token;
    const slackUserId = req.body.user_id as string;
    // const teamId = req.query.team_id;
    // const responseUrl = req.query.response_url;

    const slackIntegration = await findSlackIntegrationBySlackUserId(
      slackUserId
    );
    if (!slackIntegration) {
      res.status(200).json({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: "🚨 It looks like you haven't configured PlanningPoker.live for your account yet.",
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
                  text: 'Configure now',
                  emoji: true,
                },
                url: 'https://planningpoker.live/integrations/slack',
              },
            ],
          },
        ],
      });
      return;
    }

    res.json({
      text: 'Looking good!',
      response_type: 'in_channel',
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

async function findSlackIntegrationBySlackUserId(slackUserId: string) {
  const slackIntegrationRef = await getFirestore()
    .collectionGroup('integrations')
    .where('slackUserId', '==', slackUserId)
    .get();

  if (slackIntegrationRef.empty) {
    return undefined;
  }

  return slackIntegrationRef.docs[0].data() as SlackIntegration;
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
