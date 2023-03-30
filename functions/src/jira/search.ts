import { TokenSet } from 'openid-client';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';
import { JiraClient } from './client';
import { JiraIntegration, JiraResource } from './types';
import { CallableContext } from 'firebase-functions/v1/https';

export async function searchJira(data: any, context: CallableContext) {
  const query = data.search;
  const userId = context.auth?.uid;
  if (!userId) {
    throw new Error('Not signed in');
  }

  const jiraIntegrationRef = await getFirestore()
    .doc(`userDetails/${userId}/integrations/jira`)
    .get();

  if (!jiraIntegrationRef.exists) {
    throw new Error('JIRA integration not found.');
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

  const activeIntegration: JiraResource =
    jiraIntegration.jiraResources.find((integration) => integration.active) ||
    jiraIntegration.jiraResources[0];
  const cloudId = activeIntegration.id;

  const filteredQuery = (query as string)
    ?.replace(/[-_]+/g, ' ')
    ?.replace(/[^0-9a-zA-Z\s]+/g, '');
  console.log('filtering with:', filteredQuery);
  const searchFilter = filteredQuery
    ? `text ~ "${filteredQuery}"`
    : 'issue in issueHistory()';
  const resourceEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/search?jql=${searchFilter}&maxResults=50&fields=summary,description,status,assignee,id,key`;

  const results = await axios
    .get(resourceEndpoint, {
      headers: {
        Authorization: 'Bearer ' + tokenSet.access_token,
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
}
