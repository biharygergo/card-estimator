import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface GeneralNotificationEmailProps {
  emailTitle?: string;
  emailBody?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export const GeneralNotificationEmail = ({
  emailTitle = "Notification from Planning Poker",
  emailBody = "This is a general notification from your Planning Poker app.",
  buttonLabel,
  buttonUrl,
}: GeneralNotificationEmailProps) => {
  const previewText = emailTitle;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Section className="mt-[32px]">
              <Img
                src="https://res.cloudinary.com/dtvhnllmc/image/upload/v1751734833/planning-poker-logo_bisuaq.png"
                width="80"
                height="80"
                alt="Planning Poker"
                className="mx-auto my-0 rounded-md"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              {emailTitle}
            </Heading>
            <Section className="mt-[32px]">
              <div
                className="text-[14px] text-black leading-[24px]"
                dangerouslySetInnerHTML={{__html: emailBody}}
              />
            </Section>
            {buttonLabel && buttonUrl && (
              <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                  className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                  href={buttonUrl}
                >
                  {buttonLabel}
                </Button>
              </Section>
            )}
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              This notification was sent from <a href="https://planningpoker.live" className="text-blue-600 no-underline">PlanningPoker.live</a>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

GeneralNotificationEmail.PreviewProps = {
  emailTitle: "Welcome to Planning Poker!",
  emailBody: `
    <p>Hello there!</p>
    <p>Welcome to <strong>Planning Poker</strong> - your new favorite tool for agile estimation.</p>
    <p>We're excited to have you on board and can't wait to help you streamline your sprint planning process.</p>
    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Happy planning!</p>
  `,
  buttonLabel: "Get Started",
  buttonUrl: "https://planningpoker.com/dashboard",
} as GeneralNotificationEmailProps;

export default GeneralNotificationEmail;
