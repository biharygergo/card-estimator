import * as functions from "firebase-functions";
import {firestore, initializeApp} from "firebase-admin";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";
import * as cookieParser from "cookie-parser";
import {authorizeZoomApp, installZoomApp, zoomHome} from "./zoom/routes";

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
  cookieParser()(req, res, async () => authorizeZoomApp(req, res));
});

exports.zoomHome = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => zoomHome(req, res));
});

exports.installZoomApp = functions.https.onRequest(installZoomApp);

exports.uninstallZoomApp = functions.https.onRequest(async (req, res) => {
  console.log("Zoom App Uninstallation");
  console.log(req.body);
});
