import axios from "axios";
import {URL} from "url";
import {appConfig, getHost} from "../config";
import * as crypto from "crypto";
import * as functions from "firebase-functions";

// returns a base64 encoded url
const base64URL = (s: Buffer) =>
  s
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

const rand = (format: BufferEncoding, depth = 32) =>
  crypto.randomBytes(depth).toString(format);

const zoomHost = "https://zoom.us";
const host = new URL(zoomHost);
host.hostname = `api.${host.hostname}`;

const baseURL = host.href;

export function getInstallURL(isDev: boolean, request: functions.Request) {
  const state = rand("base64");
  const verifier = rand("ascii");

  const digest = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64")
      .toString();

  const challenge = base64URL(Buffer.from(digest));

  const redirectUrl = getRedirectUrl(request);

  console.log("redirectUrl", redirectUrl);
  const url = new URL("/oauth/authorize", zoomHost);

  url.searchParams.set("response_type", "code");
  url.searchParams.set(
      "client_id",
    isDev ? appConfig.zoomClientIdDev : appConfig.zoomClientId
  );
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);

  return {url, state, verifier};
}

function tokenRequest(params: any, isDev: boolean) {
  const username = isDev ? appConfig.zoomClientIdDev : appConfig.zoomClientId;
  const password = isDev ?
    appConfig.zoomClientSecretDev :
    appConfig.zoomClientSecret;

  return axios({
    data: new URLSearchParams(params).toString(),
    baseURL: zoomHost,
    url: "/oauth/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    auth: {
      username,
      password,
    },
  })
      .then(({data}) => Promise.resolve(data))
      .catch((error) => {
        console.error("Axios error", error.response.data);
        return Promise.reject(error.response.data);
      });
}

function apiRequest(
    method: string,
    endpoint: string,
    token: string,
    postData: any = null
) {
  return axios({
    data: postData,
    method,
    baseURL,
    url: `/v2${endpoint}`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).then(({data}) => Promise.resolve(data));
}

function getRedirectUrl(request: functions.Request) {
  const host = getHost(request);
  const redirectUrl = `${host}${appConfig.zoomRedirectUrl}`;
  console.log("redirectUrl", redirectUrl);
  return redirectUrl;
}

export async function getToken(
    code: string,
    verifier: string,
    isDev: boolean,
    request: functions.Request
) {
  if (!code || typeof code !== "string") {
    throw Error("authorization code must be a valid string");
  }

  if (!verifier || typeof verifier !== "string") {
    console.error("Verifier was invalid", verifier);
  }

  const redirectUrl = getRedirectUrl(request);

  return tokenRequest(
      {
        code,
        code_verifier: verifier ?? undefined,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
      },
      isDev
  );
}

export function getDeeplink(token: string) {
  return apiRequest("POST", "/zoomapp/deeplink", token, {
    action: JSON.stringify({
      url: "/",
      role_name: "Owner",
      verified: 1,
      role_id: 0,
    }),
  }).then((data) => Promise.resolve(data.deeplink));
}
