import axios from "axios";
import {getActiveJiraIntegration} from "./client";
import {CallableContext} from "firebase-functions/v1/https";
import * as functions from "firebase-functions";
import {captureError} from "../shared/errors";

interface JiraUpdateRequestData {
  issueId: string;
  storyPoints: number;
}

export async function updateIssue(data: any, context: CallableContext) {
  const updateRequest = data.updateRequest as JiraUpdateRequestData;
  const userId = context.auth?.uid;
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

    fieldId = nextGenStoryPointsFieldId ?? classicStoryPointsFieldId;

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
            `The 'Story points' (id: ${fieldId}) field can not be set. Make sure it is added to the 'Edit issue' screen in your JIRA project. Read more: https://support.atlassian.com/jira-cloud-administration/docs/add-a-custom-field-to-a-screen/`
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
