import axios from "axios";
import {OAuthHandler, OAuthState} from "./types";
import * as functions from "firebase-functions";
import {getHost, isRunningInDevMode} from "../config";

function getCredentials(req: functions.Request, isDev?: boolean) {
  return (isDev ?? isRunningInDevMode(req)) ?
    {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID_DEV,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET_DEV,
    } :
    {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    };
}

export class GoogleOAuthHandler extends OAuthHandler {
  startOauthFlow(req: functions.Request, state: OAuthState): string {
    const googleOAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = {
      response_type: "code",
      client_id: getCredentials(req).clientId,
      scope: "openid profile email",
      state: JSON.stringify(state),
      redirect_uri: `${getHost(req)}/api/onOAuthResult/google`,
    };

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      searchParams.set(key, value as string);
    });

    const redirectUrl = googleOAuthEndpoint + "?" + searchParams.toString();

    return redirectUrl;
  }

  async onAuthSuccess(req: functions.Request): Promise<string> {
    const code = req.query.code;
    const state: OAuthState = JSON.parse(decodeURIComponent(req.query.state as string));

    if (!code) {
      throw new Error("No auth code was provided");
    }

    if (!state) {
      throw new Error("Invalid or empty state provided");
    }

    const options = {
      method: "POST",
      url: "https://oauth2.googleapis.com/token",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      data: `code=${code}&client_id=${
        getCredentials(req, state.isDev).clientId
      }&client_secret=${
        getCredentials(req, state.isDev).clientSecret
      }&redirect_uri=${encodeURIComponent(
          `${getHost(req)}/api/onOAuthResult/google`
      )}&grant_type=authorization_code`,
    };

    try {
      const googleAccessToken = await axios
          .request(options)
          .then((response: any) => {
            return response.data;
          })
          .catch((err: any) => {
            console.error(err);
            console.log(err.response.data);
            throw new Error("Google access token request failed");
          });

      const idToken = googleAccessToken.id_token;

      return idToken;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
