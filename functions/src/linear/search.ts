import {getActiveLinearIntegration} from "./client";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";
import {CallableRequest} from "firebase-functions/v2/https";
import {RichTopic} from "../types";
import {LinearClient} from "@linear/sdk";

export async function searchLinear(
    request: CallableRequest
): Promise<RichTopic[]> {
  const query = request.data.search;
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  try {
    const {tokenSet} = await getActiveLinearIntegration(userId);
    const client = new LinearClient({
      accessToken: tokenSet.access_token,
    });

    const issues = await client.client.rawRequest(
        `
        query fetchIssues($filter: IssueFilter, first: 10) {
            title
            description
            state {
                name
            }
            assignee {
                displayName
            }
            id
            identifier
            url
        }
    `,
      query ?
        {
          filter: {
            or: [
              {title: {containsIgnoreCase: query}},
              {description: {containsIgnoreCase: query}},
            ],
          },
        } :
        {}
    );

    const richTopics = await Promise.all(
        (issues.data as any).nodes.map(async (issue: any): Promise<RichTopic> => {
          return {
            summary: issue.title,
            description: issue.description || "",
            status: issue?.state?.name || "",
            assignee: issue?.assignee?.displayName || "",
            id: issue.id,
            key: issue.identifier,
            url: issue.url,
            provider: "linear",
          };
        })
    );

    return richTopics;
  } catch (error) {
    captureError(error);
    console.error(error);
    throw new functions.https.HttpsError(
        "not-found",
        "Unknown error occured while connecting to Linear"
    );
  }
}
