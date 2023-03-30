import {TokenSet} from "openid-client";
import * as functions from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";
import axios from "axios";
import {JiraClient} from "./client";
import {JiraIntegration, JiraResource} from "./types";

export async function searchJira(
    req: functions.Request,
    res: functions.Response
) {
  const query = req.query.search;

  const jiraIntegrationRef = await getFirestore()
      .doc(`userDetails/${"lRiHFBldgwbftj8oyraTh6efLLBN"}/integrations/jira`)
      .get();

  if (!jiraIntegrationRef.exists) {
    res.status(404).json({error: "JIRA integration not found."});
    return;
  }

  const jiraIntegration = jiraIntegrationRef.data() as JiraIntegration;

  const tokenSet = new TokenSet({
    access_token: jiraIntegration.accessToken,
    refresh_token: jiraIntegration.refreshToken,
    expires_at: jiraIntegration.expiresAt,
  });

  if (tokenSet.expired()) {
    const client = new JiraClient();
    await client.initializeClient();

    const updatedToken = await client.refreshToken(tokenSet.refresh_token!);
    jiraIntegrationRef.ref.update({
      accessToken: updatedToken.access_token,
      refreshToken: updatedToken.refresh_token,
      expiresAt: updatedToken.expires_at,
    });
  }

  const activeIntegration: JiraResource = jiraIntegration.jiraResources.find((integration) => integration.active) || jiraIntegration.jiraResources[0]
  const cloudId = activeIntegration.id;

  const searchFilter = query ?
    `summary ~ "${query}"` :
    "issue in issueHistory()";
  const resourceEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/search?jql=${searchFilter}&maxResults=50&fields=summary,description,status,assignee,id,key`;

  const results = await axios
      .get(resourceEndpoint, {
        headers: {
          Authorization: "Bearer " + tokenSet.access_token,
        },
      })
      .then((response) => response.data);

  res.set("Access-Control-Allow-Origin", "*");
  return res.json(
      results.issues.map((issue: any) => ({
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status?.name,
        assignee: issue.fields.assignee?.displayName,
        id: issue.id,
        key: issue.key,
        url: `${activeIntegration.url}/browse/${issue.key}`,
      }))
  );
}
