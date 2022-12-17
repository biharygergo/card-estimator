import * as functions from "firebase-functions";
import {firestore, initializeApp, appCheck} from "firebase-admin";
import * as cookieParser from "cookie-parser";
import {
  authorizeZoomApp,
  generateCodeChallenge,
  inClientOnAuthorized,
  installZoomApp,
  zoomHome,
} from "./zoom/routes";
import {CallableContext} from "firebase-functions/v1/https";
import {
  googleAuthSuccess,
  startGoogleOauthFlow,
  zoomAuthSuccess,
} from "./zoom/googleAuth";

initializeApp();
firestore().settings({ignoreUndefinedProperties: true});

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

exports.fetchAppCheckToken = functions.https.onCall(
    async (data: any, context: CallableContext) => {
      const appId = "1:417578634660:web:3617c13e4d28109aa18531";
      try {
        const result = await appCheck().createToken(appId);
        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
        return {token: result.token, expiresAt};
      } catch (err) {
        console.error("Unable to create App Check token.", err);
        return "An error occured, please check the logs.";
      }
    }
);

exports.generateCodeChallenge = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => generateCodeChallenge(req, res));
});

exports.inClientOnAuthorized = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => inClientOnAuthorized(req, res));
});

exports.startGoogleAuth = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => startGoogleOauthFlow(req, res));
});

exports.onZoomAuthResponseRedirectToGoogle = functions.https.onRequest(
    async (req, res) => {
      cookieParser()(req, res, () => zoomAuthSuccess(req, res));
    }
);

exports.onGoogleAuthResponseDeeplink = functions.https.onRequest(
    async (req, res) => {
      cookieParser()(req, res, () => googleAuthSuccess(req, res));
    }
);

exports.giveFeedback = functions.https.onRequest(async (req, res) => {
  res.redirect("https://forms.gle/Rhd8mAQqCmewhfCR7");
});
