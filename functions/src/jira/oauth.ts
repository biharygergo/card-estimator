import {getAuth} from "firebase-admin/auth";
import {Timestamp, WriteResult, getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {JiraClient} from "./client";
import {JiraIntegration, JiraResource, UserPreference} from "../types";
import {getSessionVariable} from "../zoom/routes";
import {getHost} from "../config";
import {captureError} from "../shared/errors";
import {setSessionVariable} from "../zoom/zoomApi";
import {Request, Response} from "express";

export async function startJiraAuthFlow(
    req: Request,
    res: Response
) {
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
  }

  const client = new JiraClient();
  await client.initializeClient();

  const redirectUrl = client.authorize();
  return res.redirect(redirectUrl);
}

export async function onJiraAuthorizationReceived(
    req: Request,
    res: Response
) {
  const client = new JiraClient();
  await client.initializeClient();
  const userId = await getUserId(req, res);
  if (!userId) {
    res.status(401).send("Not signed in.");
    return;
  }

  const tokenSet = await client.getToken(req);

  try {
    const availableResources: JiraResource[] = await axios
        .get("https://api.atlassian.com/oauth/token/accessible-resources", {
          headers: {
            Authorization: "Bearer " + tokenSet.access_token,
          },
        })
        .then((response) => response.data);

    const jiraResources: JiraResource[] = availableResources.filter(
        (resource) => !!resource.scopes.filter((scope) => scope.includes("jira"))
    );

    if (!jiraResources.length) {
      res.status(404).json({message: "No JIRA resources found."});
      return;
    }

    jiraResources.forEach((jiraResource) => (jiraResource.active = false));
    jiraResources[0].active = true;

    const firestore = getFirestore();
    const collection = firestore.collection(
        `userDetails/${userId}/integrations`
    );
    const integration: JiraIntegration = {
      provider: "jira",
      createdAt: Timestamp.now(),
      accessToken: tokenSet.access_token!,
      refreshToken: tokenSet.refresh_token!,
      expiresAt: tokenSet.expires_at!,
      id: collection.doc().id,
      jiraResources,
    };

    await collection.doc("jira").set(integration);
    saveJiraPreferenceForUser(userId);

    res.status(200).redirect(getHost(req) + "/integration/success");
  } catch (e: any) {
    res.status(500).json({
      message: "Oh-oh, an error occured during Jira setup. " + e?.message,
    });
    captureError(e);
  }
}

export function saveJiraPreferenceForUser(
    userId: string
): Promise<WriteResult> {
  const updatedPreference: Partial<UserPreference> = {
    selectedIssueIntegrationProvider: "jira",
  };
  const firestore = getFirestore();

  return firestore
      .doc(`userPreferences/${userId}`)
      .set(updatedPreference, {merge: true});
}

export async function getUserId(
    req: Request,
    res: Response
): Promise<string | false> {
  const tokenId =
    (req.query.token as string | undefined) ??
    getSessionVariable(req, res, false) ??
    req.get("Authorization")?.split("Bearer ")[1];
  if (!tokenId) {
    console.error("ID token not found");
    return false;
  }

  // TODO: Make this better?
  if (!getSessionVariable(req, res, false)) {
    setSessionVariable(res, tokenId);
  }

  return getAuth()
      .verifyIdToken(tokenId)
      .then((idToken) => idToken.uid)
      .catch((error) => {
        captureError(error);
        console.error(error);
        return false;
      });
}
