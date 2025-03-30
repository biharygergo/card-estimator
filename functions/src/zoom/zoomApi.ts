import axios from "axios";
import {URL} from "url";
import {appConfig, getHost} from "../config";
import * as crypto from "crypto";
import {Request, Response} from "express";

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
    request: Request,
    redirectUrlOverride?: string
) {
  const verifier = generateVerifier();

  const redirectUrl = redirectUrlOverride ?? getRedirectUrl(request);

  const url = new URL("/oauth/authorize", zoomHost);

  url.searchParams.set("response_type", "code");
  url.searchParams.set(
      "client_id",
    isDev ? appConfig.zoomClientIdDev : appConfig.zoomClientId
  );
  url.searchParams.set("redirect_uri", redirectUrl);

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
        console.error(error.response);
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

function getRedirectUrl(request: Request) {
  const host = getHost(request);
  const redirectUrl = `${host}${appConfig.zoomRedirectUrl}`;
  return redirectUrl;
}

export async function getToken(
    code: string,
    verifier: string | undefined,
    isDev: boolean,
    request: Request,
    redirectUriOverride?: string
) {
  if (!code || typeof code !== "string") {
    throw Error("authorization code must be a valid string");
  }

  const redirectUrl = redirectUriOverride ?? getRedirectUrl(request);

  return tokenRequest(
      {
        code,
        redirect_uri: redirectUrl,
        grant_type: "authorization_code",
      },
      isDev
  );
}

export function getDeeplink(token: string, action?: any) {
  return apiRequest("POST", "/zoomapp/deeplink", token, {
    action: JSON.stringify(action),
  }).then((data) => Promise.resolve(data.deeplink)).catch((error) => {
    console.error("Error fetching deeplink", error, error?.response?.data);
    throw error;
  });
}

export const setSessionVariable = (
    res: Response,
    verifier: string
) => {
  res.cookie("__session", verifier, {secure: true});
};
