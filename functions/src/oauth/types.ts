import {Platform} from "../types";
import {Request, Response} from "express";

export enum AuthIntent {
  SIGN_IN = "signIn",
  LINK_ACCOUNT = "linkAccount",
}

export enum OAuthProvider {
  GOOGLE = "google",
  MICROSOFT = "microsoft",
  ZOOM = "zoom",
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
    req: Request,
    state: OAuthState
  ): string;
  abstract onAuthSuccess(req: Request, res?: Response): Promise<string>;
}

export function getAuthIntent(req: Request): AuthIntent {
  return req.query.intent === AuthIntent.LINK_ACCOUNT ?
    AuthIntent.LINK_ACCOUNT :
    AuthIntent.SIGN_IN;
}

export function getReturnToPath(req: Request): string | undefined {
  return req.query.returnPath as string | undefined;
}
