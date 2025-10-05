import {getFirestore} from "firebase-admin/firestore";
import {CallableRequest} from "firebase-functions/v2/https";
import {Referral, ReferralStats} from "../types";
import {ensureUserHasReferralCode, REFERRALS_COLLECTION} from "./utils";


export async function getReferralStats(
    request: CallableRequest
): Promise<ReferralStats & { referralCode: string }> {
  const userId = request.auth?.uid;

  if (!userId) {
    throw new Error("User must be authenticated");
  }

  const db = getFirestore();

  // Ensure user has a referral code (generates one if they don't)
  const referralCode = await ensureUserHasReferralCode(userId);

  // Get all referrals where this user is the referrer
  const referralsSnapshot = await db
      .collection(REFERRALS_COLLECTION)
      .where("referrerId", "==", userId)
      .get();

  const referrals: Referral[] = referralsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as Referral));

  // Calculate stats
  const totalReferred = referrals.length;
  const totalCreditsEarned = referrals
      .filter((r) => r.referrerCreditAwarded)
      .reduce((sum, r) => sum + r.referrerPendingCredits, 0);
  const pendingCredits = referrals
      .filter((r) => !r.referrerCreditAwarded)
      .reduce((sum, r) => sum + r.referrerPendingCredits, 0);

  return {
    referralCode,
    totalReferred,
    totalCreditsEarned,
    pendingCredits,
    referrals,
  };
}
