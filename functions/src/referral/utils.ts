import * as admin from "firebase-admin";

export const REFERRALS_COLLECTION: string = "referrals";

/**
 * Generates a unique referral code (8 characters, alphanumeric)
 * Format: ABC12XYZ (uppercase letters and numbers)
 * @return {string} The generated referral code
 */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique referral code and checks for collisions in Firestore
 * Retries up to 5 times if collision occurs
 */
export async function generateUniqueReferralCode(): Promise<string> {
  const db = admin.firestore();
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateReferralCode();

    // Check if code already exists
    const existingUser = await db
        .collection("userDetails")
        .where("referralCode", "==", code)
        .limit(1)
        .get();

    if (existingUser.empty) {
      return code;
    }

    console.log(`Referral code collision detected: ${code}, retrying...`);
  }

  throw new Error("Failed to generate unique referral code after maximum attempts");
}

/**
 * Looks up a user by their referral code
 * Returns the userId or null if not found
 * @param {string} referralCode - The referral code to look up
 * @return {Promise<string | null>} The userId or null if not found
 */
export async function getUserIdByReferralCode(referralCode: string): Promise<string | null> {
  const db = admin.firestore();

  const snapshot = await db
      .collection("userDetails")
      .where("referralCode", "==", referralCode)
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

/**
 * Ensures a user has a referral code, generates one if they don't
 * Returns the referral code
 * @param {string} userId - The userId to ensure has a referral code
 * @return {Promise<string>} The referral code
 */
export async function ensureUserHasReferralCode(userId: string): Promise<string> {
  const db = admin.firestore();
  const userRef = db.collection("userDetails").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error(`User ${userId} not found`);
  }

  const userData = userDoc.data();

  // If user already has a referral code, return it
  if (userData?.referralCode) {
    return userData.referralCode;
  }

  // Generate a new unique code
  const referralCode = await generateUniqueReferralCode();

  // Update user document
  await userRef.update({
    referralCode,
  });

  return referralCode;
}
