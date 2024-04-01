import { Issuer, Client, generators, TokenSet } from 'openid-client';
import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { isRunningInDevMode } from '../config';

export class LinearOauthClient {
  openIdHost = 'https://linear.app/oauth/authorize';
  issuer: Issuer | undefined;
  client: Client | undefined;
  config: { clientId: string; clientSecret: string; redirectUri: string };

  constructor() {
    const config = {
      clientId:
        (isRunningInDevMode()
          ? process.env.LINEAR_CLIENT_ID_DEV
          : process.env.LINEAR_CLIENT_ID) || '',
      clientSecret:
        (isRunningInDevMode()
          ? process.env.LINEAR_CLIENT_SECRET_DEV
          : process.env.LINEAR_CLIENT_SECRET) || '',
      redirectUri:
        (isRunningInDevMode()
          ? process.env.LINEAR_REDIRECT_URI_DEV
          : process.env.LINEAR_REDIRECT_URI) || '',
    };

    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error('Linear secrets not configured');
    }
    this.config = config;
  }

  async initializeClient() {
    this.issuer = await Issuer.discover(this.openIdHost);
    this.client = new this.issuer.Client({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: [this.config.redirectUri],
      response_type: ['code'],
    });
  }

  authorize(): string {
    if (!this.client) {
      throw new Error('Please call initialize() first.');
    }

    const codeVerifier = generators.codeVerifier();

    const codeChallenge = generators.codeChallenge(codeVerifier);

    return this.client.authorizationUrl({
      scope: 'read write',
      state: codeChallenge,
      prompt: 'consent',
      response_type: 'code',
      redirect_uri: this.config.redirectUri,
    });
  }

  async getToken(req: functions.Request) {
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

export async function getActiveLinearIntegration(userId: string): Promise<{
  linearIntegration: LinearIntegration;
  activeResource: LinearResource;
  tokenSet: TokenSet;
}> {
  const linearIntegrationRef = await getFirestore()
    .doc(`userDetails/${userId}/integrations/linear`)
    .get();

  if (!linearIntegrationRef.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Linear integration not found'
    );
  }

  const linearIntegration = linearIntegrationRef.data() as LinearIntegration;

  let tokenSet = new TokenSet({
    access_token: linearIntegration.accessToken,
    refresh_token: linearIntegration.refreshToken,
    expires_at: linearIntegration.expiresAt,
  });

  if (tokenSet.expired()) {
    const client = new LinearOauthClient();
    await client.initializeClient();

    const updatedToken = await client.refreshToken(tokenSet.refresh_token!);
    await linearIntegrationRef.ref.update({
      accessToken: updatedToken.access_token,
      refreshToken: updatedToken.refresh_token,
      expiresAt: updatedToken.expires_at,
    });
    tokenSet = updatedToken;
  }

  const activeResource: LinearResource =
    linearIntegration.linearResources.find((integration) => integration.active) ||
    linearIntegration.jiraResources?.[0];

  if (!activeResource) {
    throw new functions.https.HttpsError(
      'not-found',
      'No active Linear integration found'
    );
  }

  return { linearIntegration, activeResource, tokenSet };
}
