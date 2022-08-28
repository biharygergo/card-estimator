import {contextHeader, getAppContext} from "./cipher";
import {
  getInstallURL,
  getToken,
  getDeeplink,
  generateVerifier,
} from "./zoomApi";
import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";
import {getHost, isRunningInEmulator} from "../config";

const saveVerifierInSession = (res: functions.Response, verifier: string) => {
  res.cookie("__session", verifier);
};

const getVerifierFromSession = (
    req: functions.Request,
    res: functions.Response
) => {
  const sessionCookie = req.cookies["__session"];
  const verifier = sessionCookie;
  res.clearCookie("__session");
  return verifier;
};

export const zoomHome = async (
    req: functions.Request,
    res: functions.Response
): Promise<void> => {
  const host = getHost(req);
  try {
    const header = req.header(contextHeader);
    const isDev = isRunningInEmulator();
    const appContext = getAppContext(header as string, isDev);
    const isZoom = header && appContext;

    if (isZoom) {
      let roomId = "";
      if (appContext.iid) {
        const db = firestore();

        const roomsRef = db.collection("invitations");
        const queryRef = roomsRef.where("invitationId", "==", appContext.iid);

        const snapshot = await queryRef.get();
        if (snapshot.docs.length) {
          const doc = snapshot.docs[0];
          roomId = doc.data().roomId;
        }
      }

      const path = roomId ? `/${roomId}` : "/join";

      const finalUrl = `${host}${path}?s=zoom`;
      return res.redirect(finalUrl);
    }

    return res.redirect(`${host}/installZoomApp`);
  } catch (e) {
    console.error(e);
    res.send(
        "An error occured. Please try again or visit https://planningpoker.live"
    );
  }
};

export const installZoomApp = (
    req: functions.Request,
    res: functions.Response
): void => {
  const isDev = isRunningInEmulator();
  const {url, verifier} = getInstallURL(isDev, req);
  saveVerifierInSession(res, verifier);
  return res.redirect(url.href);
};

export const authorizeZoomApp = async (
    req: functions.Request,
    res: functions.Response
): Promise<void> => {
  try {
    let verifier: string | undefined;
    try {
      verifier = getVerifierFromSession(req, res);
    } catch (err) {
      console.error("Error while parsing session cookie: ", err);
    }

    const code = req.query.code as string;
    const isDev = isRunningInEmulator();

    // get Access Token from Zoom
    const {access_token: accessToken} = await getToken(
        code,
        verifier,
        isDev,
        req
    );

    // fetch deeplink from Zoom API
    const deeplink = await getDeeplink(accessToken);

    // redirect the user to the Zoom Client
    res.redirect(deeplink);
  } catch (e) {
    console.error(e);
    res
        .status(500)
        .send(
            "Oh no, an error occured! Please try again or visit the web app at https://planningpoker.live. Error: " +
          ((e as any).message || e)
        );
  }
};

export const generateCodeChallenge = async (
    req: functions.Request,
    res: functions.Response
) => {
  const verifier = generateVerifier();
  const codeChallenge = verifier;
  saveVerifierInSession(res, verifier);
  res.send({codeChallenge});
};

export const inClientOnAuthorized = async (
    req: functions.Request,
    res: functions.Response
) => {
  const verifier = getVerifierFromSession(req, res);
  const isDev = isRunningInEmulator();
  const zoomAuthorizationCode = req.body.code;

  // get Access Token from Zoom
  await getToken(zoomAuthorizationCode, verifier, isDev, req);
  // TODO use accessToken for fetching user-data/nickname in the future.

  res.send({success: true});
};
