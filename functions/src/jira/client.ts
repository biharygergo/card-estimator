import {Issuer, Client, generators, TokenSet} from "openid-client";
import * as functions from "firebase-functions";
import {getFirestore} from "firebase-admin/firestore";
import {JiraIntegration, JiraResource} from "../types";
import {Request} from "express";
export class JiraClient {
  openIdHost = "https://auth.atlassian.com";
  issuer: Issuer | undefined;
  client: Client | undefined;
  config: { clientId: string; clientSecret: string; redirectUri: string };

  constructor() {
    const config = {
      clientId: process.env.JIRA_CLIENT_ID || "",
      clientSecret: process.env.JIRA_CLIENT_SECRET || "",
      redirectUri: process.env.JIRA_REDIRECT_URI || "",
    };

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error("JIRA secrets not configured");
    }
    this.config = config;
  }

  async initializeClient() {
    this.issuer = await Issuer.discover(this.openIdHost);
    this.client = new this.issuer.Client({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uris: [this.config.redirectUri],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    });
  }

  authorize(): string {
    if (!this.client) {
      throw new Error("Please call initialize() first.");
    }

    const codeVerifier = generators.codeVerifier();

    const codeChallenge = generators.codeChallenge(codeVerifier);

    return this.client.authorizationUrl({
      scope:
        "read:jira-work write:issue:jira write:comment:jira write:issue.vote:jira offline_access",
      audience: "api.atlassian.com",
      state: codeChallenge,
      prompt: "consent",
      response_type: "code",
      redirect_uri: this.config.redirectUri,
    });
  }

  async getToken(req: Request) {
    const params = this.client!.callbackParams(req);

    const tokenSet = await this.client!.oauthCallback(this.config.redirectUri, {
      code: params.code,
    });

    return tokenSet;
  }

  refreshToken(refreshToken: string): Promise<TokenSet> {
    return this.client!.refresh(refreshToken);
  }
}

export async function getActiveJiraIntegration(userId: string): Promise<{jiraIntegration: JiraIntegration, activeResource: JiraResource, tokenSet: TokenSet}> {
  const jiraIntegrationRef = await getFirestore()
      .doc(`userDetails/${userId}/integrations/jira`)
      .get();

  if (!jiraIntegrationRef.exists) {
    throw new functions.https.HttpsError(
        "not-found",
        "Jira integration not found"
    );
  }

  const jiraIntegration = jiraIntegrationRef.data() as JiraIntegration;

  let tokenSet = new TokenSet({
    access_token: jiraIntegration.accessToken,
    refresh_token: jiraIntegration.refreshToken,
    expires_at: jiraIntegration.expiresAt,
  });

  if (tokenSet.expired()) {
    try {
      const client = new JiraClient();
      await client.initializeClient();

      const updatedToken = await client.refreshToken(tokenSet.refresh_token!);
      await jiraIntegrationRef.ref.update({
        accessToken: updatedToken.access_token,
        refreshToken: updatedToken.refresh_token,
        expiresAt: updatedToken.expires_at,
      });
      tokenSet = updatedToken;
    } catch (e: any) {
      if (e.message?.includes("refresh_token is invalid")) {
        throw new Error("Your refresh token is invalid. Please reconnect JIRA from the Integrations menu.");
      }

      throw e;
    }
  }

  const activeResource: JiraResource =
    jiraIntegration.jiraResources.find((integration) => integration.active) ||
    jiraIntegration.jiraResources?.[0];

  if (!activeResource) {
    throw new functions.https.HttpsError(
        "not-found",
        "No active Jira integration found"
    );
  }

  return {jiraIntegration, activeResource, tokenSet};
}
