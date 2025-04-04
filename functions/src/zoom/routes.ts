import {contextHeader, getAppContext} from "./cipher";
import {
  getInstallURL,
  getToken,
  getDeeplink,
  generateVerifier,
  setSessionVariable,
} from "./zoomApi";
import {getHost, isRunningInDevMode} from "../config";
import {AUTH_SESSIONS} from "../shared/collections";
import {getFirestore} from "firebase-admin/firestore";
import {captureError} from "../shared/errors";
import {Request, Response} from "express";
export const getSessionVariable = (
    req: Request,
    res: Response,
    clearCookie = true
) => {
  const sessionCookie = req.cookies["__session"];
  const verifier = sessionCookie;
  if (clearCookie) {
    res.clearCookie("__session");
  }
  return verifier;
};

export const zoomHome = async (
    req: Request,
    res: Response
): Promise<void> => {
  const host = getHost(req);
  try {
    const header = req.header(contextHeader);
    const isDev = isRunningInDevMode(req);
    const appContext = getAppContext(header as string, isDev);
    const isZoom = header && appContext;

    if (isZoom) {
      let roomId = "";
      if (appContext.iid) {
        const db = getFirestore();

        const roomsRef = db.collection("invitations");
        const queryRef = roomsRef.where("invitationId", "==", appContext.iid);

        const snapshot = await queryRef.get();
        if (snapshot.docs.length) {
          const doc = snapshot.docs[0];
          roomId = doc.data().roomId;
        }
      }

      if (appContext.act) {
        const action = JSON.parse(appContext.act);
        const sessionId = action.session;
        const sessionData = await (
          await getFirestore().collection(AUTH_SESSIONS).doc(sessionId).get()
        ).data();
        setSessionVariable(res, JSON.stringify(sessionData));
        await getFirestore().collection(AUTH_SESSIONS).doc(sessionId).delete();
      }

      const path = roomId ? `/join?roomId=${roomId}&s=zoom` : "/create?s=zoom";

      const finalUrl = `${host}${path}`;
      return res.redirect(finalUrl);
    }

    return res.redirect(`${host}/installZoomApp`);
  } catch (e) {
    captureError(e);
    res.send(
        "An error occured. Please try again or visit https://planningpoker.live"
    );
  }
};

export const installZoomApp = (
    req: Request,
    res: Response
): void => {
  const isDev = isRunningInDevMode(req);
  const {url, verifier} = getInstallURL(isDev, req);
  setSessionVariable(res, verifier);
  return res.redirect(url.href);
};

export const authorizeZoomApp = async (
    req: Request,
    res: Response
): Promise<void> => {
  try {
    let verifier: string | undefined;
    try {
      verifier = getSessionVariable(req, res);
    } catch (err) {
      captureError(err);
      console.error("Error while parsing session cookie: ", err);
    }

    const code = req.query.code as string;
    const isDev = isRunningInDevMode(req);

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
    captureError(e);
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
    req: Request,
    res: Response
) => {
  const verifier = generateVerifier();
  const codeChallenge = verifier;
  setSessionVariable(res, verifier);
  res.send({codeChallenge});
};

export const inClientOnAuthorized = async (
    req: Request,
    res: Response
) => {
  const verifier = getSessionVariable(req, res);
  const isDev = isRunningInDevMode(req);
  const zoomAuthorizationCode = req.body.code;

  // get Access Token from Zoom
  await getToken(zoomAuthorizationCode, verifier, isDev, req);
  // TODO use accessToken for fetching user-data/nickname in the future.

  res.send({success: true});
};
