import * as functions from "firebase-functions";
import {getAuthIntent, getReturnToPath, OAuthState} from "./types";
import {getHost, isRunningInDevMode} from "../config";
import {GoogleOAuthHandler} from "./google";
import {Platform} from "../types";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {AUTH_SESSIONS} from "../shared/collections";
import {
  getDeeplink,
  getInstallURL,
  setSessionVariable,
} from "../zoom/zoomApi";
import {getSessionVariable} from "../zoom/routes";

function getZoomAccessCodeRedirectUrl(
    req: functions.Request,
    res: functions.Response,
    authIntent: string,
    returnToPath?: string
) {
  const isDev = isRunningInDevMode(req);
  const returnUrl = `${getHost(req)}/api/startOauth?intent=${authIntent}${
    returnToPath ? `&returnPath=${returnToPath}` : ""
  }`;
  const {url, verifier} = getInstallURL(isDev, req, returnUrl);
  setSessionVariable(res, verifier);
  return url.href;
}

export function startOAuth(req: functions.Request, res: functions.Response) {
  const oauthRedirectMethod = req.query.oauthRedirectMethod as
    | string
    | undefined;
  const authId = req.query.authId as string | undefined;
  const authIntent = getAuthIntent(req);
  const returnToPath = getReturnToPath(req);
  const isDev = isRunningInDevMode(req);
  const platform = req.query.platform as Platform;
  const code = req.query.code as string | undefined;

  if (platform === "zoom" && !code) {
    const url = getZoomAccessCodeRedirectUrl(req, res, authIntent, returnToPath);
    return res.redirect(url);
  }

  const oAuthState: OAuthState = {
    platform,
    oauthRedirectMethod,
    authId,
    returnToPath,
    isDev,
    authIntent,
  };

  const redirectUrl = new GoogleOAuthHandler().startOauthFlow(req, oAuthState);

  res.redirect(redirectUrl);
}

export async function onOAuthResult(
    req: functions.Request,
    res: functions.Response
) {
  const state: OAuthState = JSON.parse(decodeURIComponent(req.query.state as string));
  const idToken = await new GoogleOAuthHandler().onAuthSuccess(req);

  if (state.platform === "teams") {
    if (state.oauthRedirectMethod === "deeplink") {
      return res.redirect(
          `msteams://teams.microsoft.com/l/auth-callback?authId=${state.authId}&result=${idToken}`
      );
    } else {
      // continue redirecting to a web-page that will call notifySuccess() – usually this method is used in Teams-Web
      const deepLink = `https://planningpoker.live/integrations/teams/auth?token=${idToken}`;
      return res.redirect(deepLink);
    }
  }

  if (state.platform === "zoom") {
    const sessionData = {
      idToken: idToken,
      createdAt: Timestamp.now(),
      authIntent: state.authIntent,
      returnToPath: state.returnToPath,
    };

    // Save idToken into temporary storage
    const savedAuthSession = await getFirestore()
        .collection(AUTH_SESSIONS)
        .add(sessionData);

    const sessionId = savedAuthSession.id;

    const accessToken = getSessionVariable(req, res);

    const deeplink = await getDeeplink(accessToken, {
      action: "getCredentialSuccess",
      session: sessionId,
    });

    return res.redirect(deeplink);
  }

  throw new Error("Unsupported platform");
}
