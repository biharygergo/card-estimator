import axios from "axios";
import {getActiveJiraIntegration} from "./client";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";
import {CallableRequest} from "firebase-functions/v2/https";

export interface IssueUpdateRequestData {
  issueId: string;
  storyPoints: number;
  provider: "jira" | "linear"
}

export async function updateIssue(request: CallableRequest) {
  const updateRequest = request.data.updateRequest as IssueUpdateRequestData;
  const userId = request.auth?.uid;
  if (!userId) {
    throw new Error("Not signed in");
  }

  let fieldId = "unknown";

  try {
    const {activeResource, tokenSet} = await getActiveJiraIntegration(userId);

    const cloudId = activeResource.id;

    const fieldsEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/field`;
    const fields: any[] = await axios
        .get(fieldsEndpoint, {
          headers: {
            Authorization: "Bearer " + tokenSet.access_token,
          },
        })
        .then((resp) => resp.data);

    const nextGenStoryPointsFieldId = fields.find(
        (field) => field.name === "Story point estimate"
    )?.id;
    const classicStoryPointsFieldId = fields.find(
        (field) => field.name === "Story Points"
    )?.id;

    fieldId =
      activeResource.storyPointsCustomFieldId ||
      nextGenStoryPointsFieldId ||
      classicStoryPointsFieldId;

    const resourceEndpoint = `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${updateRequest.issueId}`;
    const requestData = {
      fields: {
        [fieldId]: updateRequest.storyPoints,
      },
    };

    await axios
        .put(resourceEndpoint, requestData, {
          headers: {
            Authorization: "Bearer " + tokenSet.access_token,
          },
        })
        .then((response) => response.data);

    return {success: true};
  } catch (error) {
    captureError(error);
    console.error((error as any)?.response?.data);
    const errors = (error as any)?.response?.data?.errors;
    if (errors) {
      if (JSON.stringify(errors).includes("appropriate screen")) {
        throw new functions.https.HttpsError(
            "not-found",
            `The 'Story points' or custom field (id: ${fieldId}) can not be set. Is it added to the 'Edit issue' screen in your JIRA project? https://support.atlassian.com/jira-cloud-administration/docs/add-a-custom-field-to-a-screen/`
        );
      } else {
        throw new functions.https.HttpsError(
            "not-found",
            "An error occured while connecting to Jira: " + JSON.stringify(errors)
        );
      }
    } else {
      throw new functions.https.HttpsError(
          "not-found",
          "Unknown error occured while connecting to Jira"
      );
    }
  }
}
