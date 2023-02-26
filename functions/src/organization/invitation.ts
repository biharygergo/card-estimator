import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {EventContext} from "firebase-functions/v1";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";
import {sendEmail} from "../email";
import * as functions from "firebase-functions";
import {getAuth} from "firebase-admin/auth";

// TODO: move to shared types package
type InvitationData = {
  invitedById: string;
  invitationEmail: string;
  organizationId: string;
  createdAt: Timestamp;
  emailStatus: "pending" | "success" | "failure";
};

export async function acceptInvitation(
    req: functions.Request,
    res: functions.Response
) {
  const invitationId = req.query.invitationId;
  const organizationId = req.query.organizationId;

  const invitation = (
    await getFirestore()
        .doc(`organizations/${organizationId}/memberInvitations/${invitationId}`)
        .get()
  ).data() as InvitationData;

  if (!invitation) {
    throw new functions.https.HttpsError(
        "not-found",
        "This invitation does not exist."
    );
  }

  const user = await getAuth().getUserByEmail(invitation.invitationEmail);

  if (!user) {
    throw new functions.https.HttpsError(
        "failed-precondition",
        "No user account exists for this e-mail."
    );
  }

  const organization = (
    await getFirestore().doc(`organizations/${organizationId}`).get()
  ).data();

  if (!organization) {
    throw new functions.https.HttpsError(
        "not-found",
        "This Organization does not exist."
    );
  }

  const updatedMemberIds = [...organization.memberIds, user.uid];
  await getFirestore()
      .doc(`organizations/${organizationId}`)
      .update({memberIds: updatedMemberIds});
}

export async function onOrganizationInviteCreated(
    snap: DocumentSnapshot,
    context: EventContext
) {
  const emailData = snap.data() as InvitationData;
  const organizationId = context.params.organizationId;
  const invitationId = context.params.invitationId;

  const organization = (
    await getFirestore().doc(`organizations/${organizationId}`).get()
  ).data();

  const emailResult = await sendEmail({
    emailTitle: "Hey there!",
    emailBody: `
You've just been invited to join '${organization?.name}' on PlanningPoker.live. 
Accept this invitation by clicking on the button below.`,
    buttonLabel: "Accept invitation",
    buttonUrl: `https://planningpoker.live/api/acceptOrganizationInvitation?invitationId=${invitationId}&organizationId=${organizationId}`,
    subject: `Invitation to join '${organization?.name}'`,
    preheader: "Join this organization on PlanningPoker.live",
    to: emailData.invitationEmail,
  });

  console.log(emailResult);

  await getFirestore()
      .doc(`organizations/${organizationId}/memberInvitations/${invitationId}`)
      .update({emailStatus: "success"});
}
