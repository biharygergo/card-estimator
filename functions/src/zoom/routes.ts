import {contextHeader, getAppContext} from "./cipher";
import {getInstallURL, getToken, getDeeplink} from "./zoomApi";
import * as functions from "firebase-functions";
import {firestore} from "firebase-admin";

export const zoomHome = async (
    req: functions.Request,
    res: functions.Response
): Promise<void> => {
  const header = req.header(contextHeader);
  const appContext = getAppContext(header as string);
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

    const isDev = req.query.dev;
    const path = roomId ? `/${roomId}` : "/join";
    const host =
      isDev === "1" ?
        "https://d666-80-99-77-114.eu.ngrok.io" :
        "https://planningpoker.live";

    return res.redirect(`${host}${path}?s=zoom`);
  }

  return res.redirect(
      "https://us-central1-card-estimator.cloudfunctions.net/installZoomApp"
  );
};

export const installZoomApp = (
    req: functions.Request,
    res: functions.Response
): void => {
  const {url, state, verifier} = getInstallURL();
  res.cookie("verifier", verifier);
  res.cookie("state", state);
  return res.redirect(url.href);
};

export const authorizeZoomApp = async (
    req: functions.Request,
    res: functions.Response
): Promise<void> => {
  try {
    const {verifier} = req.cookies;

    res.clearCookie("verifier");
    res.clearCookie("state");

    const code = req.query.code as string;

    // get Access Token from Zoom
    const {access_token: accessToken} = await getToken(code, verifier);

    // fetch deeplink from Zoom API
    const deeplink = await getDeeplink(accessToken);

    // redirect the user to the Zoom Client
    res.redirect(deeplink);
  } catch (e) {
    console.error(e);
    res
        .status(500)
        .send(
            "Oh no, an error occured! Please try again or visit the web app at https://planningpoker.live"
        );
  }
};
