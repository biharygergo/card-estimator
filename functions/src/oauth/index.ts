import * as functions from "firebase-functions";
import {
  getAuthIntent,
  getReturnToPath,
  OAuthHandler,
  OAuthProvider,
  OAuthState,
} from "./types";
import {getHost, isRunningInDevMode} from "../config";
import {GoogleOAuthHandler} from "./google";
import {Platform} from "../types";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {AUTH_SESSIONS} from "../shared/collections";
import {
  getDeeplink,
  getInstallURL,
  getToken,
  setSessionVariable,
} from "../zoom/zoomApi";
import {getSessionVariable} from "../zoom/routes";

function getZoomAccessCodeRedirectUrl(req: functions.Request) {
  const isDev = isRunningInDevMode(req);
  const queryString = [
    ...Object.entries(req.query),
    Object.keys(req.query).includes("isDev") ? [undefined, undefined] : ["isDev", isDev ? "true" : "false"],
  ]
      .filter((entry): entry is [string, string] => !!entry[0] && entry[0] !== "code")
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`
      )
      .join("&");
  const returnUrl = `${getHost(req)}/api/startOAuth?${queryString}`;

  return returnUrl;
}

const HANDLERS: { [provider in OAuthProvider]: OAuthHandler } = {
  [OAuthProvider.GOOGLE]: new GoogleOAuthHandler(),
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

  if (platform === "zoom") {
    if (!code) {
      const returnUrl = getZoomAccessCodeRedirectUrl(req);
      const {url, verifier} = getInstallURL(isDev, req, returnUrl);
      setSessionVariable(res, verifier);
      res.redirect(url.href);
      return;
    }

    const verifier = getSessionVariable(req, res);
    const {access_token: accessToken} = await getToken(
        code,
        verifier,
        isDev,
        req,
        getZoomAccessCodeRedirectUrl(req)
    );

    setSessionVariable(res, accessToken);
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
  const state: OAuthState = JSON.parse(
      decodeURIComponent(req.query.state as string)
  );
  const provider = req.path.split("/").pop() as OAuthProvider;

  const idToken = await HANDLERS[provider].onAuthSuccess(req);

  if (req.method === "OPTIONS") {
    console.log("OPTIONS request");
    res.json({});
    return;
  }

  if (!provider || !Object.values(OAuthProvider).includes(provider)) {
    throw new Error("Invalid or missing provider");
  }

  if (state.platform === "teams") {
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

  if (state.platform === "zoom") {
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

  throw new Error("Unsupported platform");
}
