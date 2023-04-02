import {FieldValue} from "firebase-admin/firestore";

export type JiraResource = {
  id: string;
  url: string;
  name: string;
  scopes: string[];
  avatarUrl: string;
  active?: boolean;
};

export type JiraIntegration = {
  provider: "jira";
  createdAt: FieldValue;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  id: string;
  jiraResources: JiraResource[];
};
