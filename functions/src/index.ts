import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

import {initializeApp} from "firebase-admin/app";
import {appCheck} from "firebase-admin";
import * as cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";

import {
  authorizeZoomApp,
  generateCodeChallenge,
  inClientOnAuthorized,
  installZoomApp,
  zoomHome,
} from "./zoom/routes";
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
  onCustomerPaymentCreated,
  onCustomerPaymentUpdated,
  onCustomerSubscriptionCreated,
  onCustomerSubscriptionUpdated,
} from "./customers/subscription";
import {startJiraAuthFlow, onJiraAuthorizationReceived} from "./jira/oauth";
import {searchJira} from "./jira/search";
import {captureError} from "./shared/errors";
import {createSummary} from "./summary";
import {onRoomCreated} from "./room/created";
import {IssueUpdateRequestData, updateIssue} from "./jira/updateIssue";
import {onTeamsGoogleAuthResult, startTeamsGoogleAuth} from "./ms-teams";
import {createRoom} from "./room/new-room";
import {assignCreditsAsNeeded, getAllCreditBundles} from "./credits";
import {
  onLinearAuthorizationReceived,
  startLinearAuthFlow,
} from "./linear/oauth";
import {searchLinear} from "./linear/search";
import {updateLinearIssue} from "./linear/updateIssue";
import {updateRoomsTableInBigQuery} from "./room/bigquery";
import {onOAuthResult, startOAuth} from "./oauth";

initializeApp();
getFirestore().settings({ignoreUndefinedProperties: true});

Sentry.init({
  dsn: "https://cc711a2e5c854663a9feda8c1d4fcd3b@o200611.ingest.sentry.io/4504938995318784",
  tracesSampleRate: 0.7,
});

exports.authorizeZoomApp = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, async () => authorizeZoomApp(req, res));
});

exports.zoomHome = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => zoomHome(req, res));
});

exports.installZoomApp = onRequest({cors: true}, installZoomApp);

exports.uninstallZoomApp = onRequest({cors: true}, async (req) => {
  console.log("Zoom App Uninstallation");
  console.log(req.body);
});

exports.fetchAppCheckToken = onCall({cors: true}, async () => {
  const appId = "1:417578634660:web:3617c13e4d28109aa18531";
  try {
    const result = await appCheck().createToken(appId);
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    return {token: result.token, expiresAt};
  } catch (err) {
    console.error("Unable to create App Check token.", err);
    captureError(err);
    return "An error occured, please check the logs.";
  }
});

exports.generateCodeChallenge = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => generateCodeChallenge(req, res));
});

exports.inClientOnAuthorized = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => inClientOnAuthorized(req, res));
});

exports.startGoogleAuth = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => startGoogleOauthFlow(req, res));
});

exports.onZoomAuthResponseRedirectToGoogle = onRequest(
    {cors: true},
    async (req, res) => {
      cookieParser()(req, res, () => zoomAuthSuccess(req, res));
    }
);

exports.onGoogleAuthResponseDeeplink = onRequest(
    {cors: true},
    async (req, res) => {
      cookieParser()(req, res, () => googleAuthSuccess(req, res));
    }
);

exports.giveFeedback = onRequest({cors: true}, async (req, res) => {
  res.redirect("https://forms.gle/Rhd8mAQqCmewhfCR7");
});

exports.reportAnIssue = onRequest({cors: true}, async (req, res) => {
  res.redirect(
      // eslint-disable-next-line max-len
      "mailto:info@planningpoker.live?subject=Issue%20Report%20-%20Planning%20Poker&body=Dear%20Developers%2C%0D%0A%0D%0AI%20have%20run%20into%20the%20following%20issue%20while%20using%20the%20Planning%20Poker%20app%3A%0D%0A%0D%0A%3CDescribe%20your%20issue%20in%20detail%20here%3E%0D%0A%0D%0AHave%20a%20great%20day%2C%0D%0A%3CYour%20name%3E"
  );
});

exports.sendEmail = onRequest({cors: true}, async (req, res) => {
  const subject = encodeURIComponent(
      (req.query.subject as string | undefined) || ""
  );
  res.redirect(
      // eslint-disable-next-line max-len
      `mailto:info@planningpoker.live?subject=${subject}`
  );
});

exports.onUserDetailsCreate = onDocumentCreated(
    "userDetails/{userId}",
    onUserDetailsCreate
);

exports.onUserDetailsUpdate = onDocumentUpdated(
    "userDetails/{userId}",
    onUserDetailsUpdate
);

exports.setRoomPassword = onCall({cors: true}, async (request) =>
  setRoomPassword(request)
);

exports.enterProtectedRoom = onCall({cors: true}, async (request) =>
  enterProtectedRoom(request)
);

exports.onOrganizationUpdated = onDocumentUpdated(
    "organizations/{organizationId}",
    onOrganizationUpdated
);

exports.onOrganizationInvitation = onDocumentCreated(
    "organizations/{organizationId}/memberInvitations/{invitationId}",
    onOrganizationInviteCreated
);

exports.acceptOrganizationInvitation = onRequest(
    {cors: true},
    async (req, res) => {
      cookieParser()(req, res, () => acceptInvitation(req));
    }
);

exports.onUserSubscriptionCreated = onDocumentCreated(
    "customers/{customerId}/subscriptions/{subscriptionId}",
    onCustomerSubscriptionCreated
);

exports.onUserSubscriptionUpdated = onDocumentUpdated(
    "customers/{customerId}/subscriptions/{subscriptionId}",
    onCustomerSubscriptionUpdated
);

exports.startJiraAuth = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => startJiraAuthFlow(req, res));
});

exports.onJiraAuthResponse = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => onJiraAuthorizationReceived(req, res));
});

exports.queryJiraIssues = onCall({cors: true}, async (request) =>
  searchJira(request)
);

exports.updateIssue = onCall({cors: true}, async (req) =>
  (req.data.updateRequest as IssueUpdateRequestData).provider === "linear" ?
    updateLinearIssue(req) :
    updateIssue(req)
);

exports.startLinearAuth = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => startLinearAuthFlow(req, res));
});

exports.onLinearAuthResponse = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => onLinearAuthorizationReceived(req, res));
});

exports.queryLinearIssues = onCall({cors: true}, async (request) =>
  searchLinear(request)
);

exports.safeRedirect = onRequest({cors: true}, async (req, res) => {
  const redirectTo = req.query.redirectTo;
  if (typeof redirectTo === "string") {
    res.redirect(redirectTo);
  }
  return;
});

exports.createSummary = onCall({cors: true}, async (req) =>
  createSummary(req)
);

exports.onRoomCreated = onDocumentCreated("rooms/{roomId}", onRoomCreated);

exports.startTeamsGoogleAuth = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => startTeamsGoogleAuth(req, res));
});

exports.onTeamsGoogleAuthResult = onRequest(
    {cors: true},
    async (req, res) => {
      cookieParser()(req, res, () => onTeamsGoogleAuthResult(req, res));
    }
);

exports.startOAuth = onRequest({cors: true}, async (req, res) => {
  cookieParser()(req, res, () => startOAuth(req, res));
});

exports.onOAuthResult = onRequest(
    {cors: true},
    async (req, res) => {
      cookieParser()(req, res, () => onOAuthResult(req, res));
    }
);

exports.createRoom = onCall({cors: true}, createRoom);
exports.getAllCreditsAndAssignWelcome = onCall(
    {cors: true},
    async (request) => {
      if (!request.auth?.uid) {
        throw new HttpsError(
            "unauthenticated",
            "You need to be authenticated to fetch credits."
        );
      }
      await assignCreditsAsNeeded(request.auth.uid);

      return getAllCreditBundles(request.auth.uid);
    }
);

exports.onUserPaymentCreated = onDocumentCreated(
    "customers/{customerId}/payments/{paymentId}",
    onCustomerPaymentCreated
);

exports.onUserPaymentUpdated = onDocumentUpdated(
    "customers/{customerId}/payments/{paymentId}",
    onCustomerPaymentUpdated
);

exports.updateRoomsTableInBigQuery = onSchedule(
    {schedule: "every day 06:00", timeoutSeconds: 1000, memory: "1GiB"},
    async () => {
      console.log("Scheduled room update function triggered.");
      await updateRoomsTableInBigQuery();
      console.log("Room update completed.");
    }
);
