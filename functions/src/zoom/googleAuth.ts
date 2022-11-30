import axios from "axios";
import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";

import {getHost, isRunningInEmulator} from "../config";
import {getSessionVariable} from "./routes";
import {
  getDeeplink,
  getInstallURL,
  getToken,
  setSessionVariable,
} from "./zoomApi";

import {AUTH_SESSIONS} from "../shared/collections";

export enum AuthIntent {
  SIGN_IN = "signIn",
  LINK_ACCOUNT = "linkAccount",
}

export type AuthSession = {
  authIntent?: AuthIntent;
  returnToPath?: string;
  idToken: string;
  createdAt: firestore.Timestamp;
};

function getAuthIntent(req: functions.Request): AuthIntent {
  return req.query.intent === AuthIntent.LINK_ACCOUNT ?
    AuthIntent.LINK_ACCOUNT :
    AuthIntent.SIGN_IN;
}

function getReturnToPath(req: functions.Request): string | undefined {
  return req.query.returnPath as string | undefined;
}

function getReturnUrlAfterZoomAuthorization(req: functions.Request): string {
  const authIntent = getAuthIntent(req);
  const returnToPath = getReturnToPath(req);

  return `${getHost(
      req
  )}/api/onZoomAuthResponseRedirectToGoogle?intent=${authIntent}${
returnToPath ? `&returnPath=${returnToPath}` : ""
  }`;
}

export async function startGoogleOauthFlow(
    req: functions.Request,
    res: functions.Response
) {
  const isDev = isRunningInEmulator();

  const {url, verifier} = getInstallURL(
      isDev,
      req,
      getReturnUrlAfterZoomAuthorization(req)
  );

  setSessionVariable(res, verifier);

  res.redirect(url.href);
}

export async function zoomAuthSuccess(
    req: functions.Request,
    res: functions.Response
) {
  const code = req.query.code as string;
  const isDev = isRunningInEmulator();
  const authIntent = getAuthIntent(req);
  const returnToPath = getReturnToPath(req);

  let verifier: string | undefined;
  try {
    verifier = getSessionVariable(req, res);
  } catch (err) {
    console.error("Error while parsing session cookie: ", err);
  }

  if (!code) {
    const error = new Error("No auth code was provided");
    throw error;
  }

  const {access_token: accessToken} = await getToken(
      code,
      verifier,
      isDev,
      req,
      getReturnUrlAfterZoomAuthorization(req)
  );

  setSessionVariable(res, accessToken);

  const googleOAuthEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";
  const oAuthState: Partial<AuthSession> = {authIntent, returnToPath};

  const params = {
    response_type: "code",
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    scope: "openid profile email",
    state: JSON.stringify(oAuthState),
    // code_challenge: codeChallenge,
    // code_challenge_method: 'S256',
    redirect_uri: `${getHost(req)}/api/onGoogleAuthResponseDeeplink`,
  };

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.set(key, value as string);
  });

  const redirectUrl = googleOAuthEndpoint + "?" + searchParams.toString();


  res.redirect(redirectUrl);
}
export async function googleAuthSuccess(
    req: functions.Request,
    res: functions.Response
) {
  const state: Partial<AuthSession> = req.query.state ?
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

  const accessToken = getSessionVariable(req, res);

  if (!accessToken) {
    const error = new Error("Access token not found in cookie session");
    throw error;
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
        `${getHost(req)}/api/onGoogleAuthResponseDeeplink`
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

    const sessionData: AuthSession = {
      idToken: googleAccessToken.id_token,
      createdAt: firestore.Timestamp.now(),
      authIntent: state.authIntent,
      returnToPath: state.returnToPath,
    };

    // Save idToken into temporary storage
    const savedAuthSession = await firestore()
        .collection(AUTH_SESSIONS)
        .add(sessionData);

    const sessionId = savedAuthSession.id;

    const deeplink = await getDeeplink(accessToken, {
      action: "getCredentialSuccess",
      session: sessionId,
    });

    res.redirect(deeplink);
  } catch (error) {
    console.error(error);
    throw error;
  }
}
