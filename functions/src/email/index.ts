import * as sgMail from '@sendgrid/mail';

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
    throw Error('No API key found!');
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: params.to,
    from: 'Robots at PlanningPoker.live <robots-noreply@planningpoker.live>',
    templateId: 'd-0f5c7ae9340544be94467ce9c3a50ea8',
    dynamicTemplateData: {
      ...params,
    },
  };
  console.log('<Sending email> To: ', params.to);
  return sgMail.send(msg);
}
