import {getActiveLinearIntegration} from "./client";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";
import {CallableRequest} from "firebase-functions/v2/https";
import {IssueUpdateRequestData} from "../jira/updateIssue";
import {LinearClient} from "@linear/sdk";

export async function updateLinearIssue(request: CallableRequest) {
  const updateRequest = request.data.updateRequest as IssueUpdateRequestData;
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  try {
    const {tokenSet} = await getActiveLinearIntegration(userId);
    const client = new LinearClient({
      accessToken: tokenSet.access_token,
    });

    await client.updateIssue(updateRequest.issueId, {
      estimate: updateRequest.storyPoints,
    });
    return {success: true};
  } catch (error) {
    captureError(error);
    console.error(error);

    throw new functions.https.HttpsError(
        "not-found",
        "Unknown error occured while connecting to Linear"
    );
  }
}
