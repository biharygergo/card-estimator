import * as functions from "firebase-functions";
import {initializeApp} from "firebase-admin/app";
import {appCheck} from "firebase-admin";
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
import {
  onUserDetailsCreate,
  onUserDetailsUpdate,
} from "./profile/onUserCreateUpdate";
import {getFirestore} from "firebase-admin/firestore";
import {
  enterProtectedRoom,
  setRoomPassword,
} from "./room/password-protection";
import {
  acceptInvitation,
  onOrganizationInviteCreated,
} from "./organizations/invitation";
import {onOrganizationUpdated} from "./organizations/protection";
import {
  onCustomerSubscriptionCreated,
  onCustomerSubscriptionUpdated,
} from "./customers/subscription";
import {startJiraAuthFlow, onJiraAuthorizationReceived} from "./jira/oauth";
import {searchJira} from "./jira/search";

initializeApp();
getFirestore().settings({ignoreUndefinedProperties: true});

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

exports.reportAnIssue = functions.https.onRequest(async (req, res) => {
  res.redirect(
      // eslint-disable-next-line max-len
      "mailto:info@planningpoker.live?subject=Issue%20Report%20-%20Planning%20Poker&body=Dear%20Developers%2C%0D%0A%0D%0AI%20have%20run%20into%20the%20following%20issue%20while%20using%20the%20Planning%20Poker%20app%3A%0D%0A%0D%0A%3CDescribe%20your%20issue%20in%20detail%20here%3E%0D%0A%0D%0AHave%20a%20great%20day%2C%0D%0A%3CYour%20name%3E"
  );
});

exports.onUserDetailsCreate = functions.firestore
    .document("userDetails/{userId}")
    .onCreate(onUserDetailsCreate);

exports.onUserDetailsUpdate = functions.firestore
    .document("userDetails/{userId}")
    .onUpdate(onUserDetailsUpdate);

exports.setRoomPassword = functions.https.onCall(
    async (data: any, context: CallableContext) => setRoomPassword(data, context)
);

exports.enterProtectedRoom = functions.https.onCall(
    async (data: any, context: CallableContext) =>
      enterProtectedRoom(data, context)
);

exports.onOrganizationUpdated = functions.firestore
    .document("organizations/{organizationId}")
    .onUpdate(onOrganizationUpdated);

exports.onOrganizationInvitation = functions.firestore
    .document("organizations/{organizationId}/memberInvitations/{invitationId}")
    .onCreate(onOrganizationInviteCreated);

exports.acceptOrganizationInvitation = functions.https.onRequest(
    async (req, res) => {
      cookieParser()(req, res, () => acceptInvitation(req, res));
    }
);

exports.onUserSubscriptionCreated = functions.firestore
    .document("customers/{customerId}/subscriptions/{subscriptionId}")
    .onCreate(onCustomerSubscriptionCreated);

exports.onUserSubscriptionUpdated = functions.firestore
    .document("customers/{customerId}/subscriptions/{subscriptionId}")
    .onUpdate(onCustomerSubscriptionUpdated);

exports.startJiraAuth = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => startJiraAuthFlow(req, res));
});

exports.onJiraAuthResponse = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => onJiraAuthorizationReceived(req, res));
});

exports.queryJiraIssues = functions.https.onRequest(async (req, res) => {
  cookieParser()(req, res, () => searchJira(req, res));
});
