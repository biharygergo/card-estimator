import * as functions from "firebase-functions";
import {
  getAuthIntent,
  getReturnToPath,
  OAuthHandler,
  OAuthProvider,
  OAuthState,
} from "./types";
import {isRunningInDevMode} from "../config";
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
import {MicrosoftOAuthHandler} from "./microsoft";
import {getZoomAccessCodeRedirectUrl, ZoomOAuthHandler} from "./zoom";

const HANDLERS: { [provider in OAuthProvider]: OAuthHandler } = {
  [OAuthProvider.GOOGLE]: new GoogleOAuthHandler(),
  [OAuthProvider.MICROSOFT]: new MicrosoftOAuthHandler(),
  [OAuthProvider.ZOOM]: new ZoomOAuthHandler(),
};

export async function startOAuth(
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
  const platform = req.query.platform as Platform;
  const code = req.query.code as string | undefined;
  const provider = req.query.provider as OAuthProvider | undefined;

  if (!provider || !Object.values(OAuthProvider).includes(provider)) {
    throw new Error("Invalid or missing provider");
  }

  if (platform === "zoom" && !code) {
    const returnUrl = getZoomAccessCodeRedirectUrl(req);
    const {url, verifier} = getInstallURL(isDev, req, returnUrl);
    setSessionVariable(res, verifier);
    res.redirect(url.href);
    return;
  }

  const oAuthState: OAuthState = {
    platform,
    oauthRedirectMethod,
    authId,
    returnToPath,
    isDev,
    authIntent,
  };

  const redirectUrl = HANDLERS[provider].startOauthFlow(req, oAuthState);

  res.redirect(redirectUrl);
}

export async function onOAuthResult(
    req: functions.Request,
    res: functions.Response
) {
  const state: OAuthState | undefined = req.query.state ?
    JSON.parse(decodeURIComponent(req.query.state as string)) :
    undefined;
  const provider = req.path.split("/").pop() as OAuthProvider;

  const idToken = await HANDLERS[provider].onAuthSuccess(req, res);

  if (!provider || !Object.values(OAuthProvider).includes(provider)) {
    throw new Error("Invalid or missing provider");
  }

  if (state?.platform === "teams") {
    if (state.oauthRedirectMethod === "deeplink") {
      res.redirect(
          `msteams://teams.microsoft.com/l/auth-callback?authId=${state.authId}&result=${idToken}`
      );
      return;
    } else {
      // continue redirecting to a web-page that will call notifySuccess() – usually this method is used in Teams-Web
      const deepLink = `https://planningpoker.live/integrations/teams/auth?token=${idToken}`;
      res.redirect(deepLink);
      return;
    }
  }

  if (state?.platform === "zoom") {
    const sessionData = {
      idToken: idToken,
      createdAt: Timestamp.now(),
      authIntent: state.authIntent,
      returnToPath: state.returnToPath,
      provider,
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

    res.redirect(deeplink);
    return;
  }

  if (provider === OAuthProvider.ZOOM) {
    const isRedirect = req.query.provider !== provider;
    if (!isRedirect) {
      // fetch deeplink from Zoom API
      const deeplink = await getDeeplink(idToken);
      return res.redirect(deeplink);
    } else {
      setSessionVariable(res, idToken);

      await startOAuth(req, res);
      return;
    }
  }

  throw new Error("Unsupported platform");
}
