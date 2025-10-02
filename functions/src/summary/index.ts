import {getAuth} from "firebase-admin/auth";
import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {isPremiumSubscriber} from "../shared/customClaims";
import {getChatGptUsageThisMonth, saveMeteredUsage} from "../usage";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import {VertexAI} from "@google-cloud/vertexai";

const cloudProjectName = process.env.GCLOUD_PROJECT;
const location = "europe-west1";

// Initialize Vertex with your Cloud project and location
const vertexAi = new VertexAI({
  project: cloudProjectName ?? "card-estimator",
  location,
});
const model = "gemini-2.0-flash-lite";

// Instantiate the models
const generativeModel = vertexAi.preview.getGenerativeModel({
  model: model,
  generation_config: {
    max_output_tokens: 8192,
    temperature: 1.3,
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

  const existingSummaries = await summariesCollection
      .get()
      .then((snapshot) =>
        snapshot.docs
            .map((doc) => doc.data() as RoomSummary)
            .map((summary) => summary.summary)
            .join(",")
      );

  const systemPrompt = `
You are the SCRUM Master for an agile development team. Your task is to summarize the key outcomes of a planning meeting based on the provided CSV data.  The CSV contains voting results for each discussed topic, along with average, majority, and notes columns.  The team members used a numerical voting scale where lower numbers indicate simpler tasks and higher numbers represent more complex ones. The team could also use a T-Shirt sizing scale where each size represents the complexity of an issue.

Please write a summary of the meeting to be sent to the team via chat.  The summary should be approximately 300 words long, structured in at least two paragraphs, and maintain a friendly yet formal tone.

**Instructions:**

1. Parse the CSV data and extract the relevant information for each round/topic.
2. Summarize the discussions for each round, mentioning any significant disagreements or points of interest from the notes.  Be sure to explicitly state the majority vote for each topic and tailor your summary to reflect the voting results. For example, instead of saying "The team generally agreed that Topic A was relatively straightforward" say "The majority of the team voted [majority vote] for Topic A, indicating that it is relatively straightforward."
3. Conclude the summary with a motivational sentence to energize the team for the upcoming sprint.  You can include a relevant quote from a famous figure if appropriate.
4. Make sure your response is different from the previous summaries to provide a fresh perspective or a new motivational quote. ${existingSummaries.length ? `Your previous summaries were: ${existingSummaries}` : ""}

**CSV Data:**

${request.data.csvSummary}
`;

  const req = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },
    ],
  };

  const response = await generativeModel.generateContent(req);

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
