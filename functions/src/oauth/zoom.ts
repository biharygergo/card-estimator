import {OAuthHandler} from "./types";
import {getHost, isRunningInDevMode} from "../config";
import {getToken} from "../zoom/zoomApi";
import {Request} from "express";

export function getZoomAccessCodeRedirectUrl(req: Request) {
  const isDev = isRunningInDevMode(req);
  const queryString = [
    ...Object.entries(req.query),
    Object.keys(req.query).includes("isDev") ?
      [undefined, undefined] :
      isDev ? ["isDev", "true"] : [undefined, undefined],
  ]
      .filter(
          (entry): entry is [string, string] => !!entry[0] && entry[0] !== "code"
      )
      .sort(([key1], [key2]) => key1.localeCompare(key2))
      .map(
          ([key, value]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`
      )
      .join("&");
  const params = queryString ? `?${queryString}` : "";
  const returnUrl = `${getHost(req)}/api/onOAuthResult/zoom${params}`;
  return returnUrl;
}

export class ZoomOAuthHandler extends OAuthHandler {
  startOauthFlow(): string {
    throw new Error("Method not implemented.");
  }

  async onAuthSuccess(
      req: Request,
  ): Promise<string> {
    const code = req.query.code;
    const isDev = isRunningInDevMode(req);

    if (!code) {
      throw new Error("No auth code was provided");
    }
    try {
      // get Access Token from Zoom
      const {access_token: accessToken} = await getToken(
        code as string,
        undefined,
        isDev,
        req,
        getZoomAccessCodeRedirectUrl(req)
      );

      return accessToken;
    } catch (err) {
      console.error("error fetching access token from zoom", err);
      throw err;
    }
  }
}
