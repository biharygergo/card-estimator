import { getAuth } from 'firebase-admin/auth';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CallableContext, HttpsError } from 'firebase-functions/v1/https';
import { Configuration, OpenAIApi } from 'openai';
import { isPremiumSubscriber } from '../shared/customClaims';
import { getChatGptUsageThisMonth, saveMeteredUsage } from '../usage';

const configuration = new Configuration({
  organization: 'org-wBmr0xodAPTosU3YBSBxqufh',
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const USAGE_LIMIT = 5;

// TODO: Move to shared types
interface RoomSummary {
  summary: string;
  createdAt: Timestamp;
  createdById: string;
}

export async function createSummary(data: any, context: CallableContext) {
  if (!context.auth?.uid) {
    throw new HttpsError(
      'unauthenticated',
      'A user account is required for summarization'
    );
  }

  const user = await getAuth().getUser(context.auth.uid);
  const roomId = data.roomId;

  if (!user.providerData.length) {
    throw new HttpsError(
      'unauthenticated',
      'A permanent user account is required for summarization'
    );
  }

  const summariesCollection = await getFirestore()
    .collection('rooms')
    .doc(roomId)
    .collection('summaries');

  const isPremiumUser = await isPremiumSubscriber(user.uid);
  if (!isPremiumUser) {
    const usageCountThisMonth = await getChatGptUsageThisMonth(user.uid);

    if (usageCountThisMonth >= USAGE_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        'You have exceeded your summary limit for the month'
      );
    }
  }

  const prompt = `
  I want you to act like a scrum master of a team. Given the below csv summary of a planning meeting, write a summary to send to the team. 
  The csv contains votes for each discussed topic for each team member as well as the Average and a Majority columns.
  The summary should only contain full sentences and not include bullet points or tabular data. 
  Try to mention something about each round, but keep a natural tone, no need to include too many numbers. 
  The summary should be in a friendly, but formal work tone, and it should be around 150 words long. It should be structured in at least two paragraphs. 
  The votes are numbers, a low number means a more straightforward task and a higher number means a more difficult task. Members know of this scale, you don't need to explain this to them. 
  The data is below:

${data.csvSummary}
`;

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 576,
  });

  let summaryText = response.data.choices?.[0].text ?? '';
  while (summaryText.startsWith('\n')) {
    summaryText = summaryText.slice(1).trimStart();
  }

  const summaryData: RoomSummary = {
    summary: summaryText,
    createdAt: Timestamp.now(),
    createdById: user.uid,
  };
  await summariesCollection.add(summaryData);

  await saveMeteredUsage(user.uid, {
    type: 'chatgpt-query',
    createdAt: Timestamp.now(),
    subscription: isPremiumUser ? 'premium' : 'basic',
  });

  return summaryText;
}
