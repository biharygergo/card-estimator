import * as functions from "firebase-functions";
import {firestore, initializeApp} from "firebase-admin";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";
import {getInstallURL, getToken, getDeeplink} from "./zoomApi";
import * as cookieParser from "cookie-parser";
import {contextHeader, getAppContext} from "./cipher";

initializeApp();

exports.clearOldRooms = functions.pubsub
    .schedule("every 24 hours")
    .onRun(async () => {
      const db = firestore();

      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

      const roomsRef = db.collection("rooms");
      const queryRef = roomsRef.where("createdAt", "<", twoWeeksAgo);

      const snapshot = await queryRef.get();

      if (snapshot.empty) {
        console.log("No rooms older than two weeks found.");
        return;
      }

      const deletePromises: Promise<firestore.WriteResult>[] = [];
      snapshot.forEach((doc: DocumentSnapshot) => {
        console.log("Deleting room: " + doc.id);
        deletePromises.push(roomsRef.doc(doc.id).delete());
      });

      console.log(`Deleting ${deletePromises.length} old rooms.`);

      return Promise.all(deletePromises).then(() =>
        console.log("Deletion successful")
      );
    });

exports.authorizeZoomApp = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, async () => {
    // req.session.state = null;

    try {
      // sanitize code and state query parameters
      // sanitize(req);
      console.log("cookies", req.cookies);
      const {verifier} = req.cookies;

      // res.clearCookie("verifier");
      // res.clearCookie("state");

      const code = req.query.code as string;

      // get Access Token from Zoom
      const {access_token: accessToken} = await getToken(code, verifier);

      // fetch deeplink from Zoom API
      const deeplink = await getDeeplink(accessToken);

      // redirect the user to the Zoom Client
      res.redirect(deeplink);
    } catch (e) {
      console.error(e);
      res.status(500).send("Internal Server Error");
    }
  });
});

exports.zoomHome = functions.https.onRequest(async (req, res) => {
  const header = req.header(contextHeader);
  const isZoom = header && getAppContext(header);

  if (isZoom) {
    console.log("Zoom app detected.");
    return res.redirect("https://card-estimator--pr60-zoom-app-ty2lv1uf.web.app/join");
  }

  return res.redirect(
      "https://us-central1-card-estimator.cloudfunctions.net/installZoomApp"
  );
});

exports.installZoomApp = functions.https.onRequest((req, res) => {
  const {url, state, verifier} = getInstallURL();
  res.cookie("verifier", verifier);
  res.cookie("state", state);
  return res.redirect(url.href);
});
