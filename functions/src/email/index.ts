import {Resend, CreateEmailOptions} from "resend";
import {GeneralNotificationEmail} from "../emails/general-notification";
import {WelcomeEmail} from "../emails/welcome";

const resend = new Resend(process.env.RESEND_API_KEY);
export interface EmailProps {
  emailTitle: string;
  emailBody: string;
  subject: string;
  preheader: string;
  to: string;
  buttonUrl: string;
  buttonLabel: string;
  template?: React.ReactNode;
}
const FROM = "PlanningPoker.live <robots-noreply@transactional.planningpoker.live>";

function sendResendEmail(params: CreateEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.error("No API key found!");
    return;
  }
  return resend.emails.send(params);
}

export function sendEmail(params: EmailProps) {
  const msg: CreateEmailOptions = {
    to: params.to,
    from: FROM,
    // eslint-disable-next-line new-cap
    react: GeneralNotificationEmail({emailTitle: params.emailTitle, emailBody: params.emailBody, buttonLabel: params.buttonLabel, buttonUrl: params.buttonUrl}),
    subject: params.subject,
  };
  console.log("<Sending email> To: ", params.to);
  return sendResendEmail(msg);
}

export function sendWelcomeEmail(props: { email: string; name: string }) {
  return sendResendEmail({
    to: props.email,
    subject: "Welcome to PlanningPoker.live!",
    from: FROM,
    // eslint-disable-next-line new-cap
    react: WelcomeEmail(),
  });
}

export async function addContact(props: { email: string; name: string }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("No API key found!");
    return;
  }

  if (
    process.env.FUNCTIONS_EMULATOR === "true" ||
    process.env.GCLOUD_PROJECT !== "card-estimator"
  ) {
    console.log("Not subscribing to list in dev environment");
    return;
  }

  await resend.contacts.create({
    email: props.email,
    firstName: props.name.split(" ")[0],
    lastName: props.name.split(" ").slice(1).join(" "),
    unsubscribed: false,
    audienceId: "adfd8839-14d6-4013-b6f2-404076c86f3f",
  });
}
