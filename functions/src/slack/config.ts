import {Request} from "express";
import {isRunningInDevMode} from "../config";

export function getSlackConfig(req: Request) {
  return {
    clientId:
      (isRunningInDevMode(req) ?
        process.env.SLACK_CLIENT_ID_DEV :
        process.env.SLACK_CLIENT_ID) || "",
    clientSecret:
      (isRunningInDevMode(req) ?
        process.env.SLACK_CLIENT_SECRET_DEV :
        process.env.SLACK_CLIENT_SECRET) || "",
    redirectUri:
      (isRunningInDevMode(req) ?
        process.env.SLACK_REDIRECT_URL_DEV :
        process.env.SLACK_REDIRECT_URL) || "",
    signingSecret:
      (isRunningInDevMode(req) ?
        process.env.SLACK_SIGNING_SECRET_DEV :
        process.env.SLACK_SIGNING_SECRET) || "",
  };
}
