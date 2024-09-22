import * as functions from "firebase-functions";
import {Platform} from "../types";

export enum AuthIntent {
  SIGN_IN = "signIn",
  LINK_ACCOUNT = "linkAccount",
}

export enum OAuthProvider {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
}

export interface OAuthState {
  platform: Platform;
  returnToPath?: string;
  authIntent: AuthIntent;
  isDev?: boolean;
  [otherKeys: string]: any;
}

export abstract class OAuthHandler {
  abstract startOauthFlow(
    req: functions.Request,
    state: OAuthState
  ): string;
  abstract onAuthSuccess(req: functions.Request): Promise<string>;
}

export function getAuthIntent(req: functions.Request): AuthIntent {
  return req.query.intent === AuthIntent.LINK_ACCOUNT ?
    AuthIntent.LINK_ACCOUNT :
    AuthIntent.SIGN_IN;
}

export function getReturnToPath(req: functions.Request): string | undefined {
  return req.query.returnPath as string | undefined;
}
