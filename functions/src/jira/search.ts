import {TokenSet} from "openid-client";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {JiraClient} from "./client";
import {JiraIntegration, JiraResource} from "./types";
import {CallableContext} from "firebase-functions/v1/https";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";

export async function searchJira(data: any, context: CallableContext) {
  const query = data.search;
  const userId = context.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  const jiraIntegrationRef = await getFirestore()
      .doc(`userDetails/${userId}/integrations/jira`)
      .get();

  if (!jiraIntegrationRef.exists) {
    throw new functions.https.HttpsError(
        "not-found",
        "Jira integration not found"
    );
  }

  try {
    const jiraIntegration = jiraIntegrationRef.data() as JiraIntegration;

    let tokenSet = new TokenSet({
      access_token: jiraIntegration.accessToken,
      refresh_token: jiraIntegration.refreshToken,
      expires_at: jiraIntegration.expiresAt,
    });

    if (tokenSet.expired()) {
      const client = new JiraClient();
      await client.initializeClient();

      const updatedToken = await client.refreshToken(tokenSet.refresh_token!);
      await jiraIntegrationRef.ref.update({
        accessToken: updatedToken.access_token,
        refreshToken: updatedToken.refresh_token,
        expiresAt: updatedToken.expires_at,
      });
      tokenSet = updatedToken;
    }

    const activeIntegration: JiraResource =
      jiraIntegration.jiraResources.find((integration) => integration.active) ||
      jiraIntegration.jiraResources?.[0];

    if (!activeIntegration) {
      throw new functions.https.HttpsError(
          "not-found",
          "No active Jira integration found"
      );
    }

    const cloudId = activeIntegration.id;

    const filteredQuery = (query as string)
        ?.replace(/[-_]+/g, " ")
        ?.replace(/[^0-9a-zA-Z\s]+/g, "");

    const searchFilter = filteredQuery ?
      `text ~ "${filteredQuery}*"` :
      "issue in issueHistory()";
    const resourceEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/search?jql=${searchFilter}&maxResults=50&fields=summary,description,status,assignee,id,key`;

    const results = await axios
        .get(resourceEndpoint, {
          headers: {
            Authorization: "Bearer " + tokenSet.access_token,
          },
        })
        .then((response) => response.data);

    return results.issues.map((issue: any) => ({
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName,
      id: issue.id,
      key: issue.key,
      url: `${activeIntegration.url}/browse/${issue.key}`,
    }));
  } catch (error) {
    captureError(error);
    console.error(error);
    throw new functions.https.HttpsError(
        "not-found",
        "Unknown error occured while connecting to Jira"
    );
  }
}
