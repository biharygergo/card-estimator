import {EmailProps} from "../email";

export const ALMOST_OUT_OF_CREDITS: Omit<EmailProps, "to"> = {
  emailTitle: "Hi there,",
  emailBody: `I hope this message finds you well.<br/><br/>

I wanted to give you a quick heads-up: it looks like you're running low on credits for PlanningPoker.live.<br/><br/>

As you know, credits are what keep your planning sessions running smoothly on our platform. With just one credit left, now's the perfect time to stock up and ensure you're always ready to collaborate seamlessly with your team.<br/><br/>

You have options too! Whether you prefer the flexibility of pay-as-you-go credit refills or the convenience of an unlimited subscription, we've got you covered. Choose the plan that best fits your needs and enjoy uninterrupted access to our platform.<br/><br/>

Refilling your credits is easy and only takes a moment. Simply visit our <a href="https://planningpoker.live/pricing">website</a> and top up your account with the click of a button.<br/><br/>

Don't let a credit shortage slow you down! Recharge today and keep the momentum going strong.<br/><br/>

Thanks for being a valued user of our app.<br/><br/>

Best regards,<br/><br/>

Greg from PlanningPoker.live`,
  subject:
    "Recharge your credits or unlock unlimited access on PlanningPoker.live! 🪙",
  preheader: "Running low on credits!",
  buttonUrl: "https://planningpoker.live/pricing",
  buttonLabel: "Buy credits",
};

export const OUT_OF_CREDITS: Omit<EmailProps, "to"> = {
  emailTitle: "Hi there,",
  emailBody: `I hope this message finds you well.<br/><br/>

It appears that you've run out of credits for PlanningPoker.live. 🚫⏳ Credits are essential for initiating planning sessions, and we wouldn't want you to miss out on valuable collaboration opportunities.<br/><br/>

Remember, as part of our commitment to our users, you receive one free credit every month! But if you've already used up your monthly credit or need more, we've got solutions tailored to your needs. You can either refill your credits to continue enjoying our pay-as-you-go model or consider upgrading to our unlimited access subscription for uninterrupted planning.<br/><br/>

Choose the option that best aligns with your workflow and project requirements, and get back to driving results with your team effortlessly.<br/><br/>

Refilling your credits is a breeze – simply visit our <a href="https://planningpoker.live/pricing">website</a> and replenish your account with just a few clicks.<br/><br/>

Don't let a shortage of credits hold you back from achieving your goals. Take action today to ensure seamless collaboration on PlanningPoker.live! ⚡️💪<br/><br/>

Thank you for being a valued member of our community.<br/><br/>

Best regards,<br/><br/>

Greg from PlanningPoker.live`,
  subject:
      "Out of credits: refill now or upgrade to unlimited access on PlanningPoker.live! 🪙",
  preheader: "You are out of credits!",
  buttonUrl: "https://planningpoker.live/pricing",
  buttonLabel: "Buy credits",
};
