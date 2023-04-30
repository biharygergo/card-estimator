import * as sgMail from "@sendgrid/mail";
import {Client as SendGridClient} from "@sendgrid/client";
import RequestOptions from "@sendgrid/helpers/classes/request";

export function sendEmail(params: {
  emailTitle: string;
  emailBody: string;
  subject: string;
  preheader: string;
  to: string;
  buttonUrl: string;
  buttonLabel: string;
}) {
  if (!process.env.SENDGRID_API_KEY) {
    console.error("No API key found!");
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg: sgMail.MailDataRequired = {
    to: params.to,
    from: "PlanningPoker.live <robots-noreply@planningpoker.live>",
    templateId: "d-0f5c7ae9340544be94467ce9c3a50ea8",
    dynamicTemplateData: {
      ...params,
    },
    mailSettings: {
      bypassUnsubscribeManagement: {
        enable: true,
      },
    },
  };
  console.log("<Sending email> To: ", params.to);
  return sgMail.send(msg);
}

export async function addContact(props: { email: string; name: string }) {
  if (!process.env.SENDGRID_API_KEY) {
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

  const sendGridClient = new SendGridClient();
  sendGridClient.setApiKey(process.env.SENDGRID_API_KEY);

  const request: RequestOptions = {
    method: "PUT",
    url: "/v3/marketing/contacts",
    body: {
      contacts: [
        {
          email: props.email,
          first_name: props.name.split(" ")[0],
          last_name: props.name.split(" ").slice(1).join(" "),
        },
      ],
    },
  };

  await sendGridClient.request(request);
}
