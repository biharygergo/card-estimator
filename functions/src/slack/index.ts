import express from "express";
import axios from "axios";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import * as qs from "querystring";
import * as crypto from "crypto";
import cookieParser = require("cookie-parser");
import {SlackIntegration} from "../types";
import {getUserId} from "../jira/oauth";
import {getSlackConfig} from "./config";
import {createActionMessage, sendCreateRoomPubSubMessage} from "./messaging";

const slackMicroservice = express();
slackMicroservice.use(express.json());
slackMicroservice.use(cookieParser());

slackMicroservice.post(
    "/api/slack/commands/create-room",
    validateSlackRequest,
    handlePlanningPokerCommand
);
slackMicroservice.get("/api/slack/install", handleSlackInstall);
slackMicroservice.get("/api/slack/oauth-success", handleSlackOAuthSuccess);
slackMicroservice.post(
    "/api/slack/interaction",
    handleBlockInteraction
);

async function handlePlanningPokerCommand(
    req: express.Request,
    res: express.Response
) {
  const slackUserId = req.body.user_id as string;
  const teamId = req.body.team_id as string;

  const slackIntegration = await findSlackIntegrationBySlackUserId(
      slackUserId,
      teamId
  );
  if (!slackIntegration) {
    res.status(200).json(
        createActionMessage({
          text: "It seems like your PlanningPoker.live account isn't linked with Slack yet.\nTo configure the integration, open PlanningPoker.live and click \"Menu\" > \"Integrations\" > \"Slack\".",
          action: {
            id: "setup",
            label: "Set up",
            url: "https://planningpoker.live/join",
          },
        })
    );
    return;
  }

  await sendCreateRoomPubSubMessage(
      slackIntegration.userId,
      slackUserId,
      req.body.response_url
  );

  res.json({
    text: "Just a second, creating a new room for you...",
    response_type: "ephemeral",
  });
}

async function handleSlackInstall(req: express.Request, res: express.Response) {
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
    return;
  }

  res.redirect(getSlackAccessTokenRedirectUrl(req));
}

async function handleSlackOAuthSuccess(
    req: express.Request,
    res: express.Response
) {
  const code = req.query.code as string;
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
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

  res.redirect("https://planningpoker.live/integration/success");
}

async function handleBlockInteraction(
    req: express.Request,
    res: express.Response
) {
  const payload = JSON.parse(req.body.payload);
  const responseUrl = payload.response_url as string;
  const slackUserId = payload.user.id as string;
  const actions = payload.actions as any[];

  res.status(200).send();

  const action = actions?.[0];
  if (!action || action.action_id !== "join_room") {
    return;
  }

  await axios.post(responseUrl, {
    text: `👀 <@${slackUserId}> is joining the room...`,
    response_type: "in_channel",
    replace_original: false,
    thread_ts: payload.container.message_ts,
  });

  return;
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
  const url = "https://slack.com/api/oauth.v2.access";
  const options = {
    method: "POST",
    url,
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
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
      .collectionGroup("integrations")
      .where("slackUserId", "==", slackUserId)
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
  const slackSignature = req.headers["x-slack-signature"];
  const requestBody = qs.stringify(req.body);
  const timestamp = +(req.headers["x-slack-request-timestamp"] as string);
  const time = Math.floor(new Date().getTime() / 1000);

  if (Math.abs(time - timestamp) > 300) {
    return res.status(400).send("Ignore this request.");
  }
  if (!config.signingSecret) {
    return res.status(400).send("Slack signing secret is empty.");
  }

  const sigBasestring = "v0:" + timestamp + ":" + requestBody;
  const mySignature =
    "v0=" +
    crypto
        .createHmac("sha256", config.signingSecret)
        .update(sigBasestring, "utf8")
        .digest("hex");

  if (
    crypto.timingSafeEqual(
        Buffer.from(mySignature, "utf8"),
        Buffer.from(slackSignature as string, "utf8")
    )
  ) {
    next();
    return;
  } else {
    res.status(400).send("Verification failed");
    return;
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
    provider: "slack",
    userId,
    slackUserId,
    createdAt: Timestamp.now(),
    accessTokens: {
      [teamId]: {accessToken, teamId, teamName},
    },
  };

  return getFirestore()
      .doc(`userDetails/${userId}/integrations/slack`)
      .set(slackIntegration);
}

export {slackMicroservice};
