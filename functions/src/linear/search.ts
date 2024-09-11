import {getActiveLinearIntegration} from "./client";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";
import {CallableRequest} from "firebase-functions/v2/https";
import {RichTopic, IssueApiFilter, IssuesSearchApiResult} from "../types";
import {LinearClient} from "@linear/sdk";

function createNestedFilter(filters: IssueApiFilter[]): any {
  const result: any = {};

  filters.forEach(({fieldName, value, comparator}) => {
    const fieldParts = fieldName.split(".");
    let current = result;

    fieldParts.forEach((part, index) => {
      if (index === fieldParts.length - 1) {
        // Last part of the path, assign the value
        current[part] = comparator === "is" ? {eq: value} : {containsIgnoreCase: value};
      } else {
        // If the part doesn't exist, create an empty object
        if (!current[part]) {
          current[part] = {};
        }
        // Move deeper into the object
        current = current[part];
      }
    });
  });

  return result;
}

function extractLinearKeyNumber(key: string): number | null {
  const match = key.match(/[A-Z]+-(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null; // Return null if no valid key pattern is found
}

export async function searchLinear(
    request: CallableRequest
): Promise<IssuesSearchApiResult> {
  const query = request.data.search;
  const filters = request.data.filters as IssueApiFilter[] | undefined;
  const after = request.data.after as string | undefined;

  const keyMatch = extractLinearKeyNumber(query ?? "");

  const isFetchingRecents = !query && !filters;

  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  const complexFilter = createNestedFilter(filters || []);

  try {
    const {tokenSet} = await getActiveLinearIntegration(userId);
    const client = new LinearClient({
      accessToken: tokenSet.access_token,
    });

    const issues = await client.client.rawRequest(
        `
        query fetchIssues($filter: IssueFilter, $after: String) {
            issues(filter: $filter, first: 25, after: $after) {
                nodes {
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
                pageInfo {
                  hasNextPage
                  endCursor
                }
            }
        }
    `,
      isFetchingRecents ?
        {} :
        query ?
        {
          filter: {
            or: [
              {title: {containsIgnoreCase: query}},
              {description: {containsIgnoreCase: query}},
              ...keyMatch ? [{number: {eq: keyMatch}}] : [],
            ],
          },
        } :
        {
          filter: complexFilter,
          after: after?.toString(),
        }
    );

    const richTopics = (issues.data as any)?.issues?.nodes?.map(
        (issue: any): RichTopic => {
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
        }
    );

    const pageInfo = (issues.data as any)?.issues?.pageInfo;
    const nextPage = pageInfo?.hasNextPage ? pageInfo?.endCursor : undefined;

    return {issues: richTopics, nextPage};
  } catch (error) {
    captureError(error);
    console.error(error);
    throw new functions.https.HttpsError(
        "not-found",
        "Unknown error occured while connecting to Linear"
    );
  }
}
