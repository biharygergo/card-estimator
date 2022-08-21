import {contextHeader, getAppContext} from "./cipher";
import {getInstallURL, getToken, getDeeplink} from "./zoomApi";
import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";
import {getHost, isRunningInEmulator} from "../config";

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
      console.log("finalUrl", finalUrl);
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
  const {url, state, verifier} = getInstallURL(isDev, req);
  console.log(isDev);
  res.cookie("__session", JSON.stringify({verifier, state}));
  return res.redirect(url.href);
};

export const authorizeZoomApp = async (
    req: functions.Request,
    res: functions.Response
): Promise<void> => {
  try {
    const sessionCookie = req.cookies["__session"];
    const parsedCookie = JSON.parse(sessionCookie);

    const verifier = parsedCookie.verifier;

    res.clearCookie("__session");

    const code = req.query.code as string;
    const isDev = isRunningInEmulator();

    console.log(`Got code: ${code}`);
    console.log(`Got verifier: ${verifier}`);
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
