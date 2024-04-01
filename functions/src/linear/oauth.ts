import * as functions from "firebase-functions";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {LinearOauthClient} from "./client";
import {LinearIntegration, UserPreference} from "../types";
import {getHost} from "../config";
import {captureError} from "../shared/errors";
import {getUserId} from "../jira/oauth";

export async function startLinearAuthFlow(
    req: functions.Request,
    res: functions.Response
) {
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
  }

  const client = new LinearOauthClient();
  await client.initializeClient();

  const redirectUrl = client.authorize();
  return res.redirect(redirectUrl);
}

export async function onLinearAuthorizationReceived(
    req: functions.Request,
    res: functions.Response
) {
  const client = new LinearOauthClient();
  await client.initializeClient();
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
    return;
  }

  const tokenSet = await client.getToken(req);

  try {
    const firestore = getFirestore();
    const collection = firestore.collection(
        `userDetails/${userId}/integrations`
    );
    const integration: LinearIntegration = {
      provider: "linear",
      createdAt: Timestamp.now(),
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: tokenSet.expires_at!,
      id: collection.doc().id,
    };

    await collection.doc("linear").set(integration);

    const updatedPreference: Partial<UserPreference> = {
      selectedIssueIntegrationProvider: "linear",
    };
    await firestore
        .doc(`userPreferences/${userId}`)
        .set(updatedPreference, {merge: true});

    res.status(200).redirect(getHost(req) + "/integration/success");
  } catch (e: any) {
    res.status(500).json({
      message: "Oh-oh, an error occured during Linear setup. " + e?.message,
    });
    captureError(e);
  }
}
