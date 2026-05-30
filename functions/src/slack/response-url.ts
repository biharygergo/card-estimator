import axios from "axios";

const ALLOWED_SLACK_RESPONSE_URL_HOSTS = new Set([
  "hooks.slack.com",
  "hooks.slack-gov.com",
]);

export function isAllowedSlackResponseUrl(responseUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(responseUrl);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    ALLOWED_SLACK_RESPONSE_URL_HOSTS.has(parsed.hostname)
  );
}

export function postToSlackResponseUrl(responseUrl: string, body: unknown) {
  if (!isAllowedSlackResponseUrl(responseUrl)) {
    return Promise.reject(new Error("Disallowed Slack response URL"));
  }

  return axios.post(responseUrl, body);
}
