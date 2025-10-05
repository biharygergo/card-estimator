import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {createBundle} from "../credits";
import {Referral, BundleName} from "../types";

const REFERRALS_COLLECTION: string = "referrals";

/**
 * Awards referral credits to both referee and referrer when referee makes their first purchase.
 * This function should be called after a successful purchase.
 * @param {string} userId - The ID of the user who made the purchase.
 * @param {string} paymentId - The ID of the payment that triggered this.
 * @return {Promise<void>} A promise that resolves when the credits have been awarded.
 */
export async function awardReferralCreditsOnPurchase(
    userId: string,
    paymentId: string
): Promise<void> {
  const db = getFirestore();

  console.log(`Checking for referral credits to award for user: ${userId}`);

  // Find referral where this user is the referee and credits haven't been awarded yet
  const referralSnapshot = await db
      .collection(REFERRALS_COLLECTION)
      .where("refereeId", "==", userId)
      .where("refereeCreditAwarded", "==", false)
      .limit(1)
      .get();

  if (referralSnapshot.empty) {
    console.log(`No pending referral credits found for user: ${userId}`);
    return;
  }

  const referralDoc = referralSnapshot.docs[0];
  const referral = referralDoc.data() as Referral;

  console.log(
      `Found referral: ${referralDoc.id}, awarding credits to referee (${userId}) and referrer (${referral.referrerId})`
  );

  try {
    // Award credits to referee (the person who just purchased)
    await awardCreditsToUser(
        userId,
        referral.refereePendingCredits,
        paymentId,
        "referee"
    );

    // Award credits to referrer (the person who referred them)
    await awardCreditsToUser(
        referral.referrerId,
        referral.referrerPendingCredits,
        paymentId,
        "referrer"
    );

    // Update referral document
    await referralDoc.ref.update({
      refereePurchasedAt: Timestamp.now(),
      refereeCreditAwarded: true,
      referrerCreditAwarded: true,
    });

    console.log(`Successfully awarded referral credits for referral: ${referralDoc.id}`);
  } catch (error) {
    console.error("Error awarding referral credits:", error);
    throw error;
  }
}

/**
 * Creates a credit bundle and credits for a user as a referral bonus
 * @param {string} userId - The ID of the user to award credits to.
 * @param {number} creditCount - The number of credits to award.
 * @param {string} relatedPaymentId - The ID of the payment that triggered this.
 * @param {string} recipientType - The type of recipient ("referee" or "referrer").
 * @return {Promise<void>} A promise that resolves when the credits have been awarded.
 */
async function awardCreditsToUser(
    userId: string,
    creditCount: number,
    relatedPaymentId: string,
    recipientType: "referee" | "referrer"
): Promise<void> {
  const createdAt = Timestamp.now().toDate();
  const displayName = recipientType === "referee" ?
    "Referral Bonus (Welcome!)" :
    "Referral Bonus (Thank you!)";

  await createBundle(BundleName.REFERRAL_BUNDLE, userId, relatedPaymentId, displayName, createdAt);


  console.log(`Awarded ${creditCount} credits to ${recipientType} (${userId})`);
}
