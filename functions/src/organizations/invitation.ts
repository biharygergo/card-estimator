import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {EventContext} from "firebase-functions/v1";
import {DocumentSnapshot} from "firebase-functions/v1/firestore";
import {sendEmail} from "../email";
import * as functions from "firebase-functions";
import {getAuth, UserRecord} from "firebase-admin/auth";
import {getHost} from "../config";

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
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=invitation-not-found`
    );
    return;
  }

  let user: UserRecord | undefined;

  try {
    user = await getAuth().getUserByEmail(invitation.invitationEmail);
  } catch {
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=user-not-found`
    );
    return;
  }

  const organization = (
    await getFirestore().doc(`organizations/${organizationId}`).get()
  ).data();

  if (!organization) {
    req.res?.redirect(
        `${getHost(req)}/organizationInvitation?result=organization-not-found`
    );
    return;
  }

  const updatedMemberIds = [...organization.memberIds, user.uid];
  await getFirestore()
      .doc(`organizations/${organizationId}`)
      .update({memberIds: updatedMemberIds});

  req.res?.redirect(`${getHost(req)}/organizationInvitation?result=success`);
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
}