import {Response, Request} from "express";
import {getAuthIntent, OAuthProvider, OAuthState} from "./types";
import {isRunningInDevMode, getHost} from "../config";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {AUTH_SESSIONS} from "../shared/collections";
import * as crypto from "crypto";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const CODE_EXPIRY_MINUTES = 10;

function generateDeviceCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  return Array.from(bytes)
      .map((b) => CODE_CHARS[b % CODE_CHARS.length])
      .join("");
}

/**
 * Builds the OAuthState for the device-code flow.
 * The actual redirect to the OAuth provider is handled by startOAuth
 * (reusing existing handler logic), since the redirect_uri is hardcoded
 * to /api/onOAuthResult/:provider in each handler.
 */
export function buildDeviceCodeState(req: Request): OAuthState {
  const authIntent = getAuthIntent(req);
  const isDev = isRunningInDevMode(req);

  return {
    platform: "device-code" as any,
    authIntent,
    isDev,
  };
}

/**
 * Called from onOAuthResult when state.platform === "device-code".
 * Generates a short code, saves the credential to Firestore,
 * and renders an HTML page showing the code.
 */
export async function handleDeviceCodeCallback(
    req: Request,
    res: Response,
    idToken: string,
    provider: OAuthProvider,
    state: OAuthState
) {
  const code = generateDeviceCode();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
      now.toMillis() + CODE_EXPIRY_MINUTES * 60 * 1000
  );

  await getFirestore().collection(AUTH_SESSIONS).add({
    code,
    idToken,
    authIntent: state.authIntent,
    provider,
    createdAt: now,
    expiresAt,
  });

  const host = getHost(req);
  res.send(buildSuccessPage(code, host));
}

/**
 * POST /api/redeemDeviceCode
 * Accepts { code: string }, returns { idToken, provider, authIntent }.
 */
export async function redeemDeviceCode(req: Request, res: Response) {
  const code = (req.body.code as string || "").toUpperCase().trim();

  if (!code || code.length !== CODE_LENGTH) {
    res.status(400).json({error: "Invalid code format"});
    return;
  }

  const db = getFirestore();
  const snapshot = await db
      .collection(AUTH_SESSIONS)
      .where("code", "==", code)
      .limit(1)
      .get();

  if (snapshot.empty) {
    res.status(404).json({error: "Code not found or expired"});
    return;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    await doc.ref.delete();
    res.status(404).json({error: "Code not found or expired"});
    return;
  }

  await doc.ref.delete();

  res.json({
    idToken: data.idToken,
    provider: data.provider,
    authIntent: data.authIntent,
  });
}

function buildSuccessPage(code: string, host: string): string {
  const codeDisplay = code;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign-in Code - Planning Poker</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: #333;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .logo { width: 48px; height: 48px; margin-bottom: 16px; }
    .check {
      width: 56px; height: 56px;
      background: #4caf50;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    .check svg { width: 28px; height: 28px; fill: white; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .subtitle { color: #666; font-size: 14px; margin-bottom: 28px; line-height: 1.5; }
    .code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      background: #f0f4ff;
      border: 2px dashed #3f51b5;
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 24px;
      color: #3f51b5;
      user-select: all;
    }
    .instructions {
      font-size: 13px;
      color: #888;
      line-height: 1.6;
    }
    .expiry {
      margin-top: 16px;
      font-size: 12px;
      color: #aaa;
    }
  </style>
</head>
<body>
  <div class="card">
    <img src="${host}/assets/logo.png" alt="Planning Poker" class="logo" />
    <div class="check">
      <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
    </div>
    <h1>Sign-in Successful</h1>
    <p class="subtitle">Enter this code in the Zoom app to complete sign-in.</p>
    <div class="code">${codeDisplay}</div>
    <p class="instructions">
      Go back to Planning Poker in Zoom and enter the code above.<br/>
      You can close this tab afterwards.
    </p>
    <p class="expiry">This code expires in ${CODE_EXPIRY_MINUTES} minutes.</p>
  </div>
</body>
</html>`;
}
