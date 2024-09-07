import axios, {AxiosError} from "axios";
import {getActiveJiraIntegration} from "./client";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";
import {CallableRequest} from "firebase-functions/v2/https";
import {IssueApiFilter, RichTopic} from "../types";

function createComplexFilterString(filters: IssueApiFilter[]): string {
  return filters
      .map((filter) => {
        return `${filter.fieldName} ${filter.comparator === "is" ? "=" : "~"} ${
          filter.value
        }`;
      })
      .join(" ");
}

export async function searchJira(
    request: CallableRequest
): Promise<RichTopic[]> {
  const query = request.data.search;
  const filters = request.data.filters as IssueApiFilter[] | undefined;

  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  try {
    const {activeResource, tokenSet} = await getActiveJiraIntegration(userId);

    const cloudId = activeResource.id;

    const filteredQuery = (query as string)
        ?.replace(/[-_]+/g, " ")
        ?.replace(/[^0-9a-zA-Z\s]+/g, "");

    const keyRegex = /\b[A-Z][A-Z0-9_]+-[1-9][0-9]*/gm;
    const matches = (query as string)?.match(keyRegex);

    const keyPart = matches?.[0] ? ` OR key = ${matches[0]}` : "";

    const isFetchingRecents = !query && !filters;

    const searchFilter = !isFetchingRecents ?
      filters ?
        createComplexFilterString(filters) :
        `text ~ "${filteredQuery.trimEnd()}*"${keyPart}` :
      "issue in issueHistory()";
    const resourceEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/2/search?jql=${searchFilter}&maxResults=50&fields=summary,description,status,assignee,id,key`;

    const results = await axios
        .get(resourceEndpoint, {
          headers: {
            Authorization: "Bearer " + tokenSet.access_token,
          },
        })
        .then((response) => response.data);

    return results.issues.map(
        (issue: any): RichTopic => ({
          summary: issue.fields.summary,
          description: issue.fields.description,
          status: issue.fields.status?.name,
          assignee: issue.fields.assignee?.displayName,
          id: issue.id,
          key: issue.key,
          url: `${activeResource.url}/browse/${issue.key}`,
          provider: "jira",
        })
    );
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      return [];
    }
    captureError(error);
    console.error(error);
    throw new functions.https.HttpsError(
        "not-found",
        "Unknown error occured while connecting to Jira"
    );
  }
}
