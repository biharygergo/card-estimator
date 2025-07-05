import {EmailProps} from "../email";

export const ALMOST_OUT_OF_CREDITS: Omit<EmailProps, "to"> = {
  emailTitle: "⚠️ Running low on credits!",
  emailBody: `Hey there! 👋<br/><br/>

Quick heads up: you're down to your final credit on PlanningPoker.live!<br/><br/>

<strong>Good news:</strong> You can still run your next planning session with that last credit. But after that, you'll be out.<br/><br/>

I know how frustrating it is to be in the middle of a great planning session and suddenly hit a wall. That's exactly why I built this tool - to make team collaboration seamless and productive.<br/><br/>

<strong>Here's what happens next:</strong><br/>
• Your next session will work fine (you still have 1 credit!)<br/>
• But you'll need more credits for future planning meetings<br/>
• Your team is counting on you to keep things moving<br/><br/>

<strong>Two simple options to keep you rolling:</strong><br/>
🎯 <strong>Pay-as-you-go:</strong> Buy credits when you need them (perfect for occasional use)<br/>
🚀 <strong>Organization credits:</strong> Get 150 credits at a discount (most popular choice)<br/><br/>

<strong>Pro tip:</strong> The 150-credit bundle is our most popular option - it's perfect for teams and gives you the best value per credit. Plus, organization credits can be shared by all team members, making them ideal for teams with multiple scrum masters!<br/><br/>

Don't let a credit shortage derail your next sprint planning! ⚡️<br/><br/>

Best,<br/>
Greg<br/>
<em>PlanningPoker.live creator</em>`,
  subject:
    "⚠️ Running low on credits! Stock up now",
  preheader: "You have 1 credit left - secure your future planning sessions",
  buttonUrl: "https://planningpoker.live/pricing?tab=org-credits",
  buttonLabel: "Get More Credits",
};

export const OUT_OF_CREDITS: Omit<EmailProps, "to"> = {
  emailTitle: "🚫 Out of credits - action required!",
  emailBody: `Hey there! 👋<br/><br/>

You've hit zero credits on PlanningPoker.live. This means your next planning session is on hold until you refill.<br/><br/>

<strong>Here's the situation:</strong><br/>
• Your team is ready to plan their next sprint<br/>
• But you can't start the session without credits<br/>
• Every delay costs your team momentum and productivity<br/><br/>

<strong>Good news:</strong> You get 1 free credit every month! But since you've used yours up, here are your options:<br/><br/>

🎯 <strong>Quick fix:</strong> Buy credits now and get back to planning immediately<br/>
🚀 <strong>Team favorite:</strong> Get 150 organization credits at a discount (most popular)<br/><br/>

<strong>Why the 150-credit bundle makes sense:</strong><br/>
• Best value per credit<br/>
• Perfect for team planning sessions<br/>
• No more credit anxiety for months<br/>
• Most popular choice among our users<br/>
• <strong>Shared credits:</strong> All team members can use them - ideal for teams with multiple scrum masters!<br/><br/>

Your team is counting on you to keep the planning sessions running smoothly. Don't let them down! ⚡️<br/><br/>

Best,<br/>
Greg<br/>
<em>PlanningPoker.live creator</em>`,
  subject:
      "🚫 Out of credits! Your team is waiting",
  preheader: "Action required: refill credits to continue planning sessions",
  buttonUrl: "https://planningpoker.live/pricing?tab=org-credits",
  buttonLabel: "Get Credits Now",
};
