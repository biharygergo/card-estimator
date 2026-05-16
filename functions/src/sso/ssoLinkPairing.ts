import {Response, Request} from "express";
import {getAuth, UserRecord} from "firebase-admin/auth";
import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {CallableRequest, HttpsError} from "firebase-functions/v2/https";
import {createHash, randomBytes, randomInt} from "crypto";
import {SSO_LINK_PAIRINGS} from "../shared/collections";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const USER_CODE_LENGTH = 6;
const EXPIRY_MINUTES = 10;
const DEVICE_SECRET_BYTES = 32;

function generateUserCode(): string {
  const n = CODE_CHARS.length;
  return Array.from({length: USER_CODE_LENGTH}, () =>
    CODE_CHARS[randomInt(n)]
  ).join("");
}

function generateDeviceSecret(): string {
  return randomBytes(DEVICE_SECRET_BYTES).toString("hex");
}

function hashDeviceSecret(deviceSecret: string): string {
  return createHash("sha256").update(deviceSecret, "utf8").digest("hex");
}

async function generateUniqueUserCode(): Promise<string> {
  const db = getFirestore();
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateUserCode();
    const existing = await db
        .collection(SSO_LINK_PAIRINGS)
        .where("userCode", "==", code)
        .limit(1)
        .get();
    if (existing.empty) {
      return code;
    }
  }
  throw new Error("Could not allocate user code");
}

/**
 * True when the user's email domain has ssoDomains config and providerData
 * includes that provider (SAML or OIDC).
 */
export async function userHasDomainEnterpriseSsoLinked(
    authUser: UserRecord,
): Promise<boolean> {
  const email = authUser.email;
  if (!email) {
    return false;
  }
  const domain = email.split("@").pop()?.toLowerCase();
  if (!domain) {
    return false;
  }
  const db = getFirestore();
  const ssoSnap = await db.doc(`ssoDomains/${domain}`).get();
  if (!ssoSnap.exists) {
    return false;
  }
  const ssoData = ssoSnap.data() as {providerId: string};
  return authUser.providerData.some(
      (p) => p.providerId === ssoData.providerId,
  );
}

/**
 * POST /api/createSsoLinkPairing
 * Body: {} — returns { pairingId, userCode, deviceSecret }
 */
export async function createSsoLinkPairing(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const userCode = await generateUniqueUserCode();
  const deviceSecret = generateDeviceSecret();
  const deviceSecretHash = hashDeviceSecret(deviceSecret);
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(
      now.toMillis() + EXPIRY_MINUTES * 60 * 1000,
  );

  const db = getFirestore();
  const docRef = db.collection(SSO_LINK_PAIRINGS).doc();
  await docRef.set({
    userCode,
    deviceSecretHash,
    status: "pending",
    createdAt: now,
    expiresAt,
  });

  console.log("[ssoLinkPairing] create", {pairingId: docRef.id, userCode});

  res.json({
    pairingId: docRef.id,
    userCode,
    deviceSecret,
    expiresInMinutes: EXPIRY_MINUTES,
  });
}

/**
 * POST /api/redeemSsoLinkPairing
 * Body: { pairingId: string, deviceSecret: string }
 * Returns { customToken } when pairing is completed and valid.
 */
export async function redeemSsoLinkPairing(req: Request, res: Response) {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const pairingId = (req.body.pairingId as string | undefined)?.trim();
  const deviceSecret = req.body.deviceSecret as string | undefined;

  if (!pairingId || !deviceSecret) {
    res.status(400).json({error: "pairingId and deviceSecret are required"});
    return;
  }

  const db = getFirestore();
  const docRef = db.doc(`${SSO_LINK_PAIRINGS}/${pairingId}`);
  const snap = await docRef.get();

  if (!snap.exists) {
    console.log("[ssoLinkPairing] redeem", {pairingId, branch: "not_found"});
    res.status(404).json({error: "Pairing not found"});
    return;
  }

  const data = snap.data()!;
  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    await docRef.delete();
    console.log("[ssoLinkPairing] redeem", {pairingId, branch: "expired"});
    res.status(410).json({error: "Pairing expired"});
    return;
  }

  if (data.deviceSecretHash !== hashDeviceSecret(deviceSecret)) {
    console.log("[ssoLinkPairing] redeem", {pairingId, branch: "invalid_secret"});
    res.status(403).json({error: "Invalid device secret"});
    return;
  }

  if (data.status !== "completed" || !data.uid) {
    console.log("[ssoLinkPairing] redeem", {
      pairingId,
      branch: "not_completed",
      status: data.status,
      hasUid: Boolean(data.uid),
    });
    res.status(404).json({error: "Pairing not completed yet"});
    return;
  }

  let customToken: string;
  try {
    customToken = await getAuth().createCustomToken(data.uid as string);
  } catch (e) {
    console.error("[ssoLinkPairing] redeem", {
      pairingId,
      branch: "token_failed",
      message: e instanceof Error ? e.message : String(e),
    });
    res.status(500).json({error: "Could not mint token"});
    return;
  }

  await docRef.delete();
  console.log("[ssoLinkPairing] redeem", {pairingId, branch: "success"});
  res.json({customToken});
}

/**
 * Callable: authenticated user marks pairing complete after linking SSO in browser.
 */
export async function completeSsoLinkPairing(
    request: CallableRequest<{ pairingId?: string }>,
): Promise<{ ok: true }> {
  const uid = request.auth?.uid;
  const pairingId = request.data?.pairingId?.trim();
  console.log("[ssoLinkPairing] complete:enter", {pairingId, uid});

  if (!uid) {
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      reason: "unauthenticated",
    });
    throw new HttpsError("unauthenticated", "Sign in required");
  }
  if (!pairingId) {
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      uid,
      reason: "missing_pairing_id",
    });
    throw new HttpsError("invalid-argument", "pairingId is required");
  }

  const db = getFirestore();
  const docRef = db.doc(`${SSO_LINK_PAIRINGS}/${pairingId}`);
  const snap = await docRef.get();

  if (!snap.exists) {
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      uid,
      reason: "not_found",
    });
    throw new HttpsError("not-found", "Pairing not found or already used");
  }

  const data = snap.data()!;
  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    await docRef.delete();
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      uid,
      reason: "expired",
    });
    throw new HttpsError("deadline-exceeded", "Pairing expired");
  }

  if (data.status !== "pending") {
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      uid,
      reason: "not_pending",
      status: data.status,
    });
    throw new HttpsError("failed-precondition", "Pairing is not pending");
  }

  const authUser = await getAuth().getUser(uid);
  const linked = await userHasDomainEnterpriseSsoLinked(authUser);
  if (!linked) {
    console.log("[ssoLinkPairing] complete:rejected", {
      pairingId,
      uid,
      reason: "sso_not_linked",
      providerIds: authUser.providerData.map((p) => p.providerId),
    });
    throw new HttpsError(
        "failed-precondition",
        "Your account does not have enterprise SSO linked for this email domain. " +
        "Use “Link work SSO” after signing in with the correct work email.",
    );
  }

  await docRef.update({
    status: "completed",
    uid,
    completedAt: FieldValue.serverTimestamp(),
  });

  console.log("[ssoLinkPairing] complete:success", {pairingId, uid});

  return {ok: true};
}
