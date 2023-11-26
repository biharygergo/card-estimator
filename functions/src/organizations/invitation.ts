import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {sendEmail} from "../email";
import * as functions from "firebase-functions";
import {getAuth, UserRecord} from "firebase-admin/auth";
import {getHost} from "../config";
import {FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";

// TODO: move to shared types package
type InvitationData = {
  invitedById: string;
  invitationEmail: string;
  organizationId: string;
  createdAt: Timestamp;
  emailStatus: "pending" | "success" | "failure";
  status: "pending" | "accepted";
  acceptedAt: Timestamp;
};

export async function acceptInvitation(
    req: functions.Request,
) {
  console.log("<Accepting invitation>");
  const invitationId = req.query.invitationId;
  const organizationId = req.query.organizationId;

  const invitation = (
    await getFirestore()
        .doc(`organizations/${organizationId}/memberInvitations/${invitationId}`)
        .get()
  ).data() as InvitationData;

  if (!invitation || invitation.status === "accepted") {
    console.error("<Invitation not found>");
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=invitation-not-found`
    );
    return;
  }

  let user: UserRecord | undefined;

  try {
    user = await getAuth().getUserByEmail(invitation.invitationEmail);
  } catch {
    console.error("<User not found>");
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=user-not-found`
    );
    return;
  }

  const organization = (
    await getFirestore().doc(`organizations/${organizationId}`).get()
  ).data();

  if (!organization) {
    console.error("<Organization not found>");
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=organization-not-found`
    );
    return;
  }

  const updatedMemberIds = [...organization.memberIds, user.uid];
  await getFirestore()
      .doc(`organizations/${organizationId}`)
      .update({memberIds: updatedMemberIds});

  await getFirestore()
      .doc(`organizations/${organizationId}/memberInvitations/${invitationId}`)
      .update({status: "accepted", acceptedAt: Timestamp.now()});
  req.res?.redirect(`${getHost(req)}/organizationInvitation?result=success`);
}

export async function onOrganizationInviteCreated(
    snap: FirestoreEvent<QueryDocumentSnapshot|undefined>
) {
  const emailData = snap.data?.data() as InvitationData;
  const organizationId = snap.params.organizationId;
  const invitationId = snap.params.invitationId;

  const organization = (
    await getFirestore().doc(`organizations/${organizationId}`).get()
  ).data();

  try {
    const emailResult = await sendEmail({
      emailTitle: "Hey there!",
      emailBody: `
  You've just been invited to join <strong>'${organization?.name}'</strong> on PlanningPoker.live. 
  Accept this invitation by clicking on the button below. <br/><br/>
  
  What to expect when joining an organization?
  <ul>
    <li>First, you'll need to create an account with this email address.</li>
    <li>Click on the link below and it will link the invitation with your registration.</li>
    <li>Check the "My Organization" menu, your new org will show up!</li>
  </ul>
  `,
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
  } catch (e) {
    console.error("<Error sending email>", e);

    await getFirestore()
        .doc(`organizations/${organizationId}/memberInvitations/${invitationId}`)
        .update({emailStatus: "error"});
  }
}
