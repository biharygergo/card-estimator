import {getAuth} from "firebase-admin/auth";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {isPremiumSubscriber} from "../shared/customClaims";
import {getChatGptUsageThisMonth, saveMeteredUsage} from "../usage";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import {VertexAI} from "@google-cloud/vertexai";

const cloudProjectName = process.env.GCLOUD_PROJECT;
const location = "us-central1";

// Initialize Vertex with your Cloud project and location
const vertexAi = new VertexAI({
  project: cloudProjectName ?? "card-estimator",
  location,
});
const model = "gemini-1.5-flash-001";

// Instantiate the models
const generativeModel = vertexAi.preview.getGenerativeModel({
  model: model,
  generation_config: {
    max_output_tokens: 8192,
    temperature: 0.5,
    top_p: 0.95,
  },
});

const USAGE_LIMIT = 100;

// TODO: Move to shared types
interface RoomSummary {
  summary: string;
  createdAt: Timestamp;
  createdById: string;
}

export async function createSummary(request: CallableRequest) {
  if (!request.auth?.uid) {
    throw new HttpsError(
        "unauthenticated",
        "A user account is required for summarization"
    );
  }

  const user = await getAuth().getUser(request.auth.uid);
  const roomId = request.data.roomId;

  if (!user.providerData.length) {
    throw new HttpsError(
        "unauthenticated",
        "A permanent user account is required for summarization"
    );
  }

  const summariesCollection = await getFirestore()
      .collection("rooms")
      .doc(roomId)
      .collection("summaries");

  const isPremiumUser = await isPremiumSubscriber(user.uid);
  const usageCountThisMonth = await getChatGptUsageThisMonth(user.uid);

  if (usageCountThisMonth >= USAGE_LIMIT) {
    throw new HttpsError(
        "resource-exhausted",
        "You have exceeded your summary limit for the month"
    );
  }

  const systemPrompt = `
  You are the helpful SCRUM Master of an agile development team. Given the below CSV export of a planning meeting, write a summary to send to the team via chat. 
 
The CSV contains votes for each discussed topic for each team member and the Average, Majority, and Notes columns. The topic names are either "Topic of Round #X" where X is the round (1, 2, etc.) or they can be custom topic names for what was discussed in the meeting.   The votes are numbers, a low number means a more straightforward task and a higher number means a more difficult task. Members know of this scale, you don't need to explain this to them. 

Try to mention something about each round, but keep a natural tone, there is no need to include too many numbers. The summary should be in a friendly, but formal work tone, and it should be around 150 words long (it should not be shorter!). It should be structured in at least two paragraphs.

Finish with a motivating sentence for the upcoming sprint to energize the team. You can even quote someone famous.

The CSV file is:

`;

  const req = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt + request.data.csvSummary,
          },
        ],
      },
    ],
  };

  const response = await generativeModel.generateContent(req);

  console.log(response);

  const summaryText =
    response.response.candidates?.[0].content?.parts?.[0]?.text ?? "";

  const summaryData: RoomSummary = {
    summary: summaryText,
    createdAt: Timestamp.now(),
    createdById: user.uid,
  };
  await summariesCollection.add(summaryData);

  await saveMeteredUsage(user.uid, {
    type: "chatgpt-query",
    createdAt: Timestamp.now(),
    subscription: isPremiumUser ? "premium" : "basic",
  });

  return summaryText;
}
