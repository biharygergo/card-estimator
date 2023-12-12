import axios from "axios";
import {URL} from "url";
import {appConfig, getHost} from "../config";
import * as crypto from "crypto";
import * as functions from "firebase-functions";

const rand = (format: BufferEncoding, depth = 32) =>
  crypto.randomBytes(depth).toString(format);

const zoomHost = "https://zoom.us";
const host = new URL(zoomHost);
host.hostname = `api.${host.hostname}`;

const baseURL = host.href;

export function generateVerifier() {
  return Buffer.from(rand("ascii")).toString("base64url");
}

export function getInstallURL(
    isDev: boolean,
    request: functions.Request,
    redirectUrlOverride?: string
) {
  const verifier = generateVerifier();
  const challenge: string = crypto
      .createHash("sha256")
      .update(verifier)
      .digest("base64url");

  const redirectUrl = redirectUrlOverride ?? getRedirectUrl(request);

  const url = new URL("/oauth/authorize", zoomHost);

  url.searchParams.set("response_type", "code");
  url.searchParams.set(
      "client_id",
    isDev ? appConfig.zoomClientIdDev : appConfig.zoomClientId
  );
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return {url, verifier};
}

function tokenRequest(params: any, isDev: boolean) {
  const username = isDev ? appConfig.zoomClientIdDev : appConfig.zoomClientId;
  const password = isDev ?
    appConfig.zoomClientSecretDev :
    appConfig.zoomClientSecret;

  const dataToSend = new URLSearchParams(params).toString();
  return axios({
    data: dataToSend,
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
  return redirectUrl;
}

export async function getToken(
    code: string,
    verifier: string | undefined,
    isDev: boolean,
    request: functions.Request,
    redirectUriOverride?: string
) {
  if (!code || typeof code !== "string") {
    throw Error("authorization code must be a valid string");
  }

  if (!verifier || typeof verifier !== "string") {
    console.error("Verifier was invalid", verifier);
  }

  const redirectUrl = redirectUriOverride ?? getRedirectUrl(request);

  return tokenRequest(
      {
        code,
        code_verifier: verifier,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
      },
      isDev
  );
}

export function getDeeplink(token: string, action?: any) {
  return apiRequest("POST", "/zoomapp/deeplink", token, {
    action: JSON.stringify(action),
  }).then((data) => Promise.resolve(data.deeplink));
}

export const setSessionVariable = (
    res: functions.Response,
    verifier: string
) => {
  res.cookie("__session", verifier, {secure: true});
};
