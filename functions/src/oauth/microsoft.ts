import {Client, Issuer} from "openid-client";
import {OAuthHandler, OAuthState} from "./types";
import {getHost, isRunningInDevMode} from "../config";
import axios from "axios";
import {Request} from "express";

function getCredentials(req: Request, isDev?: boolean) {
  return isDev || isRunningInDevMode(req) ?
    {
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID_DEV!,
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET_DEV!,
    } :
    {
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET!,
    };
}

class MicrosoftOAuthClient {
  openIdHost =
    "https://login.microsoftonline.com/common/oauth2/v2.0";
  issuer: Issuer;
  client: Client;
  config: { clientId: string; clientSecret: string };

  constructor(req: Request, isDev?: boolean) {
    const config = getCredentials(req, isDev);

    if (!config.clientId || !config.clientSecret) {
      throw new Error("Microsoft secrets not configured");
    }
    this.config = config;

    this.issuer = new Issuer({
      issuer:
        "https://login.microsoftonline.com/common/v2.0",
      authorization_endpoint: this.openIdHost + "/authorize",
      token_endpoint: this.openIdHost + "/token",
    });
    this.client = new this.issuer.Client({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uri: [getHost(req) + "/api/onOAuthResult/microsoft"],
      response_type: ["code"],
    });
  }

  authorize(state: OAuthState): string {
    return this.client.authorizationUrl({
      scope: "openid profile email",
      state: JSON.stringify(state),
      prompt: "consent",
      response_type: "code",
      response_mode: "query",
    });
  }

  async getToken(req: Request) {
    const params = this.client!.callbackParams(req);

    const tokenSet = await this.client!.callback(
        getHost(req) + "/api/onOAuthResult/microsoft",
        params,
        {state: params.state}
    );

    return tokenSet;
  }
}

export class MicrosoftOAuthHandler extends OAuthHandler {
  startOauthFlow(req: Request, state: OAuthState): string {
    const client = new MicrosoftOAuthClient(req, state.isDev);
    return client.authorize(state);
  }

  async onAuthSuccess(req: Request): Promise<string> {
    const code = req.query.code;
    const state: OAuthState = JSON.parse(
        decodeURIComponent(req.query.state as string)
    );

    if (!code) {
      throw new Error("No auth code was provided");
    }

    if (!state) {
      throw new Error("Invalid or empty state provided");
    }

    const options = {
      method: "POST",
      url: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      data: `code=${code}&client_id=${
        getCredentials(req, state.isDev).clientId
      }&client_secret=${
        getCredentials(req, state.isDev).clientSecret
      }&redirect_uri=${encodeURIComponent(
          `${getHost(req)}/api/onOAuthResult/microsoft`
      )}&grant_type=authorization_code`,
    };

    try {
      const tokens = await axios
          .request(options)
          .then((response: any) => {
            return response.data;
          })
          .catch((err: any) => {
            console.error(err);
            console.log(err.response.data);
            throw new Error("Microsoft access token request failed");
          });

      const idToken = tokens.id_token;

      return idToken;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
