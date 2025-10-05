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

interface BenefitSection {
  title: string;
  description: string;
  icon: string;
}

interface OrganizationWelcomeEmailProps {
  organizationName?: string;
  benefits?: BenefitSection[];
  buttonLabel?: string;
  buttonUrl?: string;
}

const defaultBenefits: BenefitSection[] = [
  {
    icon: "👥",
    title: "Invite Your Team",
    description: "Welcome colleagues to your organization in two easy ways: Go to <strong>Menu > My Organization</strong> and send email invitations, or click directly on any room member's avatar and select <strong>\"Add to organization\"</strong>. The more team members, the more value you get!",
  },
  {
    icon: "🔗",
    title: "Create Recurring Meeting Links",
    description: "Stop creating rooms every time! Create permanent meeting links and add them to your organization's calendar. Your team can join the same link for every sprint planning session - it acts as a recurring meeting room. Perfect for regular ceremonies!",
  },
  {
    icon: "💳",
    title: "Share Organization Credits",
    description: "Buy credits once and share them across all scrum masters in your organization. No more individual purchases or expense reports! Manage who can use credits and control permissions directly from the organization settings dialog. <a href='https://planningpoker.live/pricing?tab=org-credits' style='color: #2563eb; text-decoration: none;'>View organization pricing</a>.",
  },
  {
    icon: "⚙️",
    title: "Centralized Management",
    description: "Control everything from one place: manage members, set permissions, track credit usage, and customize settings for your entire organization. You're now the admin with full control!",
  },
  {
    icon: "🔌",
    title: "Connect Jira or Linear",
    description: "Import tickets directly from Jira or Linear into your planning sessions - no more copy-pasting! Export your estimates back to update story points automatically. Connect your account from <strong>Menu > Integrations</strong>. <a href='https://planningpoker.live/integrations' style='color: #2563eb; text-decoration: none;'>Learn more about integrations</a>.",
  },
  {
    icon: "💻",
    title: "Install in Your Video Conferencing Tool",
    description: "Run planning sessions directly inside Zoom, Microsoft Teams, Google Meet, or Webex. No need to switch windows - everything happens right in your meeting. Install the app for your platform and make planning seamless. <a href='https://planningpoker.live/integrations' style='color: #2563eb; text-decoration: none;'>Install now</a>.",
  },
];

export const OrganizationWelcomeEmail = ({
  organizationName = "your organization",
  benefits = defaultBenefits,
  buttonLabel,
  buttonUrl,
}: OrganizationWelcomeEmailProps = {}) => {
  const previewText = "Learn how to get the most out of your organization!";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[600px] rounded border border-[#eaeaea] border-solid p-[20px]">
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
              {organizationName}, get the most out of PlanningPoker.live
            </Heading>

            <Text className="text-[14px] text-black leading-[24px]">
              You've just unlocked the full power of PlanningPoker.live! Organizations are designed for teams that want to streamline their planning sessions, share resources, and collaborate more effectively.
            </Text>

            <Text className="text-[14px] text-black leading-[24px] mt-[16px]">
              Here's everything you can do now that you're running an organization:
            </Text>

            <Section className="mt-[32px]">
              {benefits.map((benefit, index) => (
                <div key={index} className="mb-[32px]">
                  <Heading className="mx-0 my-[16px] p-0 font-semibold text-[16px] text-black">
                    {benefit.icon} {benefit.title}
                  </Heading>
                  <Text
                    className="text-[14px] text-black leading-[24px]"
                    dangerouslySetInnerHTML={{__html: benefit.description}}
                  />
                  {index < benefits.length - 1 && (
                    <Hr className="mx-0 my-[24px] w-full border border-[#eaeaea] border-solid" />
                  )}
                </div>
              ))}
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

            <Text className="text-[14px] text-black leading-[24px]">
              Have questions about organizations? Need help setting things up? Want to discuss custom plans for larger teams? Reach out directly at{" "}
              <a href="mailto:info@planningpoker.live" className="text-blue-600 no-underline">
                info@planningpoker.live
              </a>
              . I'm here to help!
            </Text>

            <Text className="text-[14px] text-black leading-[24px] mt-[16px]">
              Welcome to the team! 🚀<br />
              Greg<br />
              <em>PlanningPoker.live creator</em>
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center mt-[32px]">
              This notification was sent from PlanningPoker.live
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OrganizationWelcomeEmail.PreviewProps = {
  organizationName: "Acme Corp",
  benefits: defaultBenefits,
  buttonLabel: "Manage Your Organization",
  buttonUrl: "https://planningpoker.live/create",
} as OrganizationWelcomeEmailProps;

export default OrganizationWelcomeEmail;
