import axios from "axios";
import {isRunningInDevMode, getHost} from "../config";
import * as functions from "firebase-functions";
import {AuthIntent, getAuthIntent, getReturnToPath} from "../zoom/googleAuth";

type TeamsOauthState = {
  oauthRedirectMethod: string;
  authId: string;
  isDev: boolean;
  returnToPath?: string;
  authIntent: AuthIntent;
};

export async function startTeamsGoogleAuth(
    req: functions.Request,
    res: functions.Response
) {
  const oauthRedirectMethod = req.query.oauthRedirectMethod as
    | string
    | undefined;
  const authId = req.query.authId as string | undefined;
  const authIntent = getAuthIntent(req);
  const returnToPath = getReturnToPath(req);

  const isDev = isRunningInDevMode(req);

  if (!(authId && oauthRedirectMethod)) {
    const error = new Error("No authId or oauthRedirectMethod was provided");
    throw error;
  }

  const googleOAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  const oAuthState: TeamsOauthState = {
    oauthRedirectMethod,
    authId,
    returnToPath,
    isDev,
    authIntent,
  };

  const params = {
    response_type: "code",
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    scope: "openid profile email",
    state: JSON.stringify(oAuthState),
    redirect_uri: `${getHost(req)}/api/onTeamsGoogleAuthResult`,
  };

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value as string);
  });

  const redirectUrl = googleOAuthEndpoint + "?" + searchParams.toString();

  res.redirect(redirectUrl);
}

export async function onTeamsGoogleAuthResult(
    req: functions.Request,
    res: functions.Response
) {
  const state: Partial<TeamsOauthState> = req.query.state ?
    JSON.parse(req.query.state as string) :
    {};

  // 1 Validate code and state
  // 1a. Check for auth code from Auth0 following authenication there
  if (!req.query.code) {
    const error = new Error("No auth code was provided");
    // error.status = 400
    throw error;
  }

  if (!state) {
    throw new Error("Invalid or empty state provided");
  }

  // Exchange Google code for Google API access token
  const options = {
    method: "POST",
    url: "https://oauth2.googleapis.com/token",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    data: `code=${req.query.code}&client_id=${
      process.env.GOOGLE_OAUTH_CLIENT_ID
    }&client_secret=${
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    }&redirect_uri=${encodeURIComponent(
        `${getHost(req)}/api/onTeamsGoogleAuthResult`
    )}&grant_type=authorization_code`,
  };

  try {
    // 2b. Make the request
    const googleAccessToken = await axios
        .request(options)
        .then((response: any) => {
          return response.data;
        })
        .catch((err: any) => {
          console.error(err);
          console.log(err.response.data);
          throw new Error("auth0 access token request failed");
        });

    const idToken = googleAccessToken.id_token;

    if (state.oauthRedirectMethod === "deeplink") {
      return res.redirect(
          `msteams://teams.microsoft.com/l/auth-callback?authId=${state.authId}&result=${idToken}`
      );
    } else {
      // continue redirecting to a web-page that will call notifySuccess() – usually this method is used in Teams-Web
      const deepLink = `https://planningpoker.live/integrations/teams/auth?token=${idToken}`;
      return res.redirect(deepLink);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
