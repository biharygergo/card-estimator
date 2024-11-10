import {onRequest, onCall, HttpsError} from "firebase-functions/v2/https";
import {onSchedule} from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentUpdated,
} from "firebase-functions/v2/firestore";

import {getFirestore} from "firebase-admin/firestore";
import {initializeApp} from "firebase-admin/app";

import {appCheck} from "firebase-admin";
import * as cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import {IssueUpdateRequestData} from "./jira/updateIssue";

initializeApp();
getFirestore().settings({ignoreUndefinedProperties: true});

Sentry.init({
  dsn: "https://cc711a2e5c854663a9feda8c1d4fcd3b@o200611.ingest.sentry.io/4504938995318784",
  tracesSampleRate: 0.7,
});

exports.authorizeZoomApp = onRequest({cors: true}, async (req, res) => {
  const {authorizeZoomApp} = await import("./zoom/routes");
  return cookieParser()(req, res, async () => authorizeZoomApp(req, res));
});

exports.zoomHome = onRequest({cors: true}, async (req, res) => {
  const {zoomHome} = await import("./zoom/routes");
  return cookieParser()(req, res, () => zoomHome(req, res));
});

exports.installZoomApp = onRequest({cors: true}, async (req, res) => {
  const {installZoomApp} = await import("./zoom/routes");
  return installZoomApp(req, res);
});

exports.uninstallZoomApp = onRequest({cors: true}, async (req) => {
  console.log("Zoom App Uninstallation");
  console.log(req.body);
  return;
});

exports.fetchAppCheckToken = onCall({cors: true}, async () => {
  try {
    const result = await appCheck().createToken(
        "1:417578634660:web:3617c13e4d28109aa18531"
    );
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60;
    return {token: result.token, expiresAt};
  } catch (err) {
    console.error("Unable to create App Check token.", err);
    const {captureError} = await import("./shared/errors");
    captureError(err);
    return "An error occurred, please check the logs.";
  }
});

exports.generateCodeChallenge = onRequest({cors: true}, async (req, res) => {
  const {generateCodeChallenge} = await import("./zoom/routes");
  return cookieParser()(req, res, () => generateCodeChallenge(req, res));
});

exports.inClientOnAuthorized = onRequest({cors: true}, async (req, res) => {
  const {inClientOnAuthorized} = await import("./zoom/routes");
  return cookieParser()(req, res, () => inClientOnAuthorized(req, res));
});

exports.startGoogleAuth = onRequest({cors: true}, async (req, res) => {
  const {startGoogleOauthFlow} = await import("./zoom/googleAuth");
  return cookieParser()(req, res, () => startGoogleOauthFlow(req, res));
});

exports.onZoomAuthResponseRedirectToGoogle = onRequest(
    {cors: true},
    async (req, res) => {
      const {zoomAuthSuccess} = await import("./zoom/googleAuth");
      return cookieParser()(req, res, () => zoomAuthSuccess(req, res));
    }
);

exports.onGoogleAuthResponseDeeplink = onRequest(
    {cors: true},
    async (req, res) => {
      const {googleAuthSuccess} = await import("./zoom/googleAuth");
      return cookieParser()(req, res, () => googleAuthSuccess(req, res));
    }
);

exports.giveFeedback = onRequest({cors: true}, async (req, res) => {
  return res.redirect("https://forms.gle/Rhd8mAQqCmewhfCR7");
});

exports.reportAnIssue = onRequest({cors: true}, async (req, res) => {
  return res.redirect(
      "mailto:info@planningpoker.live?subject=Issue%20Report%20-%20Planning%20Poker&body=Dear%20Developers%2C%0D%0A%0D%0AI%20have%20run%20into%20the%20following%20issue%20while%20using%20the%20Planning%20Poker%20app%3A%0D%0A%0D%0A%3CDescribe%20your%20issue%20in%20detail%20here%3E%0D%0A%0D%0AHave%20a%20great%20day%2C%0D%0A%3CYour%20name%3E"
  );
});

exports.sendEmail = onRequest({cors: true}, async (req, res) => {
  const subject = encodeURIComponent(
      (req.query.subject as string | undefined) || ""
  );
  return res.redirect(`mailto:info@planningpoker.live?subject=${subject}`);
});

exports.onUserDetailsCreate = onDocumentCreated(
    "userDetails/{userId}",
    async (snap) => {
      const {onUserDetailsCreate} = await import(
          "./profile/onUserCreateUpdate"
      );
      return onUserDetailsCreate(snap);
    }
);

exports.onUserDetailsUpdate = onDocumentUpdated(
    "userDetails/{userId}",
    async (change) => {
      const {onUserDetailsUpdate} = await import(
          "./profile/onUserCreateUpdate"
      );
      return onUserDetailsUpdate(change);
    }
);

exports.setRoomPassword = onCall({cors: true}, async (request) => {
  const {setRoomPassword} = await import("./room/password-protection");
  return setRoomPassword(request);
});

exports.enterProtectedRoom = onCall({cors: true}, async (request) => {
  const {enterProtectedRoom} = await import("./room/password-protection");
  return enterProtectedRoom(request);
});

exports.onOrganizationUpdated = onDocumentUpdated(
    "organizations/{organizationId}",
    async (change) => {
      const {onOrganizationUpdated} = await import(
          "./organizations/protection"
      );
      return onOrganizationUpdated(change);
    }
);

exports.onOrganizationInvitation = onDocumentCreated(
    "organizations/{organizationId}/memberInvitations/{invitationId}",
    async (snap) => {
      const {onOrganizationInviteCreated} = await import(
          "./organizations/invitation"
      );
      return onOrganizationInviteCreated(snap);
    }
);

exports.acceptOrganizationInvitation = onRequest(
    {cors: true},
    async (req, res) => {
      const {acceptInvitation} = await import("./organizations/invitation");
      return cookieParser()(req, res, () => acceptInvitation(req));
    }
);

exports.onUserSubscriptionCreated = onDocumentCreated(
    "customers/{customerId}/subscriptions/{subscriptionId}",
    async (snap) => {
      const {onCustomerSubscriptionCreated} = await import(
          "./customers/subscription"
      );
      return onCustomerSubscriptionCreated(snap);
    }
);

exports.onUserSubscriptionUpdated = onDocumentUpdated(
    "customers/{customerId}/subscriptions/{subscriptionId}",
    async (change) => {
      const {onCustomerSubscriptionUpdated} = await import(
          "./customers/subscription"
      );
      return onCustomerSubscriptionUpdated(change);
    }
);

exports.startJiraAuth = onRequest({cors: true}, async (req, res) => {
  const {startJiraAuthFlow} = await import("./jira/oauth");
  return cookieParser()(req, res, () => startJiraAuthFlow(req, res));
});

exports.onJiraAuthResponse = onRequest({cors: true}, async (req, res) => {
  const {onJiraAuthorizationReceived} = await import("./jira/oauth");
  return cookieParser()(req, res, () => onJiraAuthorizationReceived(req, res));
});

exports.queryJiraIssues = onCall({cors: true}, async (request) => {
  const {searchJira} = await import("./jira/search");
  return searchJira(request);
});

exports.updateIssue = onCall({cors: true}, async (req) => {
  const {updateIssue} = await import("./jira/updateIssue");
  const {updateLinearIssue} = await import("./linear/updateIssue");
  return (req.data.updateRequest as IssueUpdateRequestData).provider ===
    "linear" ?
    updateLinearIssue(req) :
    updateIssue(req);
});

exports.startLinearAuth = onRequest({cors: true}, async (req, res) => {
  const {startLinearAuthFlow} = await import("./linear/oauth");
  return cookieParser()(req, res, () => startLinearAuthFlow(req, res));
});

exports.onLinearAuthResponse = onRequest({cors: true}, async (req, res) => {
  const {onLinearAuthorizationReceived} = await import("./linear/oauth");
  return cookieParser()(req, res, () =>
    onLinearAuthorizationReceived(req, res)
  );
});

exports.queryLinearIssues = onCall({cors: true}, async (request) => {
  const {searchLinear} = await import("./linear/search");
  return searchLinear(request);
});

exports.safeRedirect = onRequest({cors: true}, async (req, res) => {
  const redirectTo = req.query.redirectTo;
  if (typeof redirectTo === "string") {
    return res.redirect(redirectTo);
  }
  return;
});

exports.createSummary = onCall({cors: true}, async (req) => {
  const {createSummary} = await import("./summary");
  return createSummary(req);
});

exports.onRoomCreated = onDocumentCreated("rooms/{roomId}", async (snap) => {
  const {onRoomCreated} = await import("./room/created");
  return onRoomCreated(snap);
});

exports.startTeamsGoogleAuth = onRequest({cors: true}, async (req, res) => {
  const {startTeamsGoogleAuth} = await import("./ms-teams");
  return cookieParser()(req, res, () => startTeamsGoogleAuth(req, res));
});

exports.onTeamsGoogleAuthResult = onRequest(
    {cors: true},
    async (req, res) => {
      const {onTeamsGoogleAuthResult} = await import("./ms-teams");
      return cookieParser()(req, res, () => onTeamsGoogleAuthResult(req, res));
    }
);

exports.startOAuth = onRequest({cors: true}, async (req, res) => {
  const {startOAuth} = await import("./oauth");
  return cookieParser()(req, res, () => startOAuth(req, res));
});

exports.onOAuthResult = onRequest({cors: true}, async (req, res) => {
  const {onOAuthResult} = await import("./oauth");
  return cookieParser()(req, res, () => onOAuthResult(req, res));
});

exports.slack = onRequest({cors: true}, async (req, res) => {
  const {slackMicroservice} = await import("./slack");
  console.log("running slack", req.path);
  return slackMicroservice(req, res);
});

exports.createRoom = onCall({cors: true}, async (req) => {
  const {createRoom} = await import("./room/new-room");
  return createRoom(req);
});

exports.getAllCreditsAndAssignWelcome = onCall(
    {cors: true},
    async (request) => {
      if (!request.auth?.uid) {
        throw new HttpsError(
            "unauthenticated",
            "You need to be authenticated to fetch credits."
        );
      }
      const {assignCreditsAsNeeded, getAllCreditBundles} = await import(
          "./credits"
      );
      await assignCreditsAsNeeded(request.auth.uid);
      return getAllCreditBundles(request.auth.uid);
    }
);

exports.onUserPaymentCreated = onDocumentCreated(
    "customers/{customerId}/payments/{paymentId}",
    async (snap) => {
      const {onCustomerPaymentCreated} = await import(
          "./customers/subscription"
      );
      return onCustomerPaymentCreated(snap);
    }
);

exports.onUserPaymentUpdated = onDocumentUpdated(
    "customers/{customerId}/payments/{paymentId}",
    async (change) => {
      const {onCustomerPaymentUpdated} = await import(
          "./customers/subscription"
      );
      return onCustomerPaymentUpdated(change);
    }
);

exports.updateRoomsTableInBigQuery = onSchedule(
    {schedule: "every day 06:00", timeoutSeconds: 1000, memory: "1GiB"},
    async () => {
      console.log("Scheduled room update function triggered.");
      const {updateRoomsTableInBigQuery} = await import("./room/bigquery");
      await updateRoomsTableInBigQuery();
      console.log("Room update completed.");
      return;
    }
);
