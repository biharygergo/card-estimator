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

  interface TipSection {
    title: string;
    description: string;
    imageUrl?: string;
    imageAlt?: string;
    size?: "wide" | "normal";
  }

  interface WelcomeEmailProps {
    tips?: TipSection[];
    buttonLabel?: string;
    buttonUrl?: string;
  }

const defaultTips: TipSection[] = [
  {
    title: "💻 Install in Zoom, Meet, Teams, or Webex",
    description: "Running planning sessions during video calls? Install our app directly in your conferencing tool for seamless estimation. Your team won't know how they lived without it. <a href='https://planningpoker.live/integrations' style='color: #2563eb; text-decoration: none;'>Install now</a>.",
    imageUrl: "https://res.cloudinary.com/dtvhnllmc/image/upload/v1751740493/Integrations_Teams_1_ugiisk_mnprcm.gif",
    imageAlt: "Integrations Teams",
    size: "normal",
  },
  {
    title: "🏢 Create an organization (pro tip!)",
    description: "Keep your team organized with shared credits, custom branding, and recurring meetings. Plus, you get better pricing on credits when you buy as a team. Win-win! <a href='https://planningpoker.live/pricing?tab=org-credits' style='color: #2563eb; text-decoration: none;'>Check out team pricing</a>.",
  },
  {
    title: "🔗 Connect Jira or Linear (game changer!)",
    description: "Import your tickets directly into planning sessions. No more copy-pasting! Just go to Menu > Integrations and connect your account. Your team will thank you. <a href='https://planningpoker.live/integrations' style='color: #2563eb; text-decoration: none;'>Learn more about integrations</a>.",
    imageUrl: "https://res.cloudinary.com/dtvhnllmc/image/upload/v1751741410/720x405_quyhlk.gif",
    imageAlt: "Integrations Jira",
    size: "wide",
  },
  {
    title: "🃏 Customize your card set",
    description: "Start with Fibonacci or T-shirt sizing, then create your own custom cards under Room Settings. Perfect for teams with unique estimation styles!",
  },
  {
    title: "📝 Take notes during each round",
    description: "Capture important discussions in real-time. Notes are saved per round and shared with your team. Perfect for retrospectives and sprint planning documentation.",
  },
  {
    title: "🤖 Let PokerBot summarize your meetings",
    description: "Our AI assistant creates meeting summaries with motivational quotes for your next sprint. Try it: Manage Rounds > Summarize. It's like having a personal scrum master! <a href='https://planningpoker.live/features' style='color: #2563eb; text-decoration: none;'>Discover more features</a>.",
  },
];

export const WelcomeEmail = ({
  tips = defaultTips,
  buttonLabel,
  buttonUrl,
}: WelcomeEmailProps = {}) => {
  const previewText = "Welcome to PlanningPoker.live! Here's how to get started 🚀";

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
                Welcome to PlanningPoker.live! 👋
            </Heading>

            <Text className="text-[14px] text-black leading-[24px]">
                Look who decided to join the smart crowd! 🎉 You're one of the 5% of users who actually register (the ones who don't just lurk anonymously). Welcome to the club of teams that make planning sessions actually enjoyable instead of soul-crushing!
            </Text>

            <Text className="text-[14px] text-black leading-[24px] mt-[16px]">
                Here are some pro tips to help you hit the ground running and make your team's planning sessions legendary:
            </Text>

            <Section className="mt-[32px]">
              {tips.map((tip, index) => (
                <div key={index} className="mb-[32px]">
                  <Heading className="mx-0 my-[16px] p-0 font-semibold text-[16px] text-black">
                    {tip.title}
                  </Heading>
                  {tip.imageUrl && (
                    <div className="my-[16px] text-center">
                      <Img
                        src={tip.imageUrl}
                        alt={tip.imageAlt || tip.title}
                        className={`mx-auto rounded-md object-cover ${tip.size === "normal" ? "max-h-[350px] w-4/5" : "w-full max-h-[250px]"}`}
                      />
                    </div>
                  )}
                  <Text
                    className="text-[14px] text-black leading-[24px]"
                    dangerouslySetInnerHTML={{__html: tip.description}}
                  />
                  {index < tips.length - 1 && (
                    <Hr className="mx-0 my-[24px] w-full border border-[#eaeaea] border-solid" />
                  )}
                </div>
              ))}
            </Section>

            <Section className="mt-[32px]">
              <Text
                className="text-[14px] text-black leading-[24px]"
                dangerouslySetInnerHTML={{__html: "<strong>Pro tip:</strong> You get 1 free credit every month, but most teams end up buying more because they love how smooth their planning sessions become. Consider grabbing some credits now so you're ready when inspiration strikes! <a href=\"https://planningpoker.live/pricing\" style='color: #2563eb; text-decoration: none;'>Check out our pricing</a>."}}
              />
            </Section>

            <Section className="mt-[32px]">
              <Text className="text-[14px] text-black leading-[24px]">
                  Join thousands of teams from companies like yours who've made PlanningPoker.live their go-to planning tool. Your team is going to love this!
              </Text>
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
                Questions? Ideas? Just want to chat? Hit me up at{" "}
              <a href="mailto:info@planningpoker.live" className="text-blue-600 no-underline">
                  info@planningpoker.live
              </a>
                . I'm just one person building this in my spare time, so I love hearing from users!
            </Text>

            <Text className="text-[14px] text-black leading-[24px] mt-[16px]">
                Happy planning! 🎯<br />
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

WelcomeEmail.PreviewProps = {
  tips: defaultTips,
  buttonLabel: "Create a room",
  buttonUrl: "https://planningpoker.live/create",
} as WelcomeEmailProps;

export default WelcomeEmail;
