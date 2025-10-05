import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {FirestoreEvent, QueryDocumentSnapshot} from "firebase-functions/v2/firestore";
import {getUserIdByReferralCode, REFERRALS_COLLECTION} from "./utils";
import {UserDetails, Referral} from "../types";

const CREDITS_PER_REFERRAL = 3;

/**
 * Handles referral attribution when a new user signs up
 * Creates a referral record if the user was referred by someone
 * @param {FirestoreEvent<QueryDocumentSnapshot | undefined>} snap - The firestore event snapshot
 * @return {Promise<void>} A promise that resolves when the referral record has been created.
 */
export async function onUserDetailsCreatedReferral(
    snap: FirestoreEvent<QueryDocumentSnapshot | undefined>
) {
  const userDetails = snap.data?.data() as UserDetails;
  const userId = snap.data?.id;

  if (!userId) {
    console.log("No user ID found in snapshot");
    return;
  }

  // Check if user was referred
  if (!userDetails.referredByCode) {
    console.log(`User ${userId} was not referred by anyone`);
    return;
  }

  const referralCode = userDetails.referredByCode;
  console.log(`User ${userId} was referred with code: ${referralCode}`);

  // Look up the referrer
  const referrerId = await getUserIdByReferralCode(referralCode);

  if (!referrerId) {
    console.error(`No user found with referral code: ${referralCode}`);
    return;
  }

  // Prevent self-referral
  if (referrerId === userId) {
    console.error(`User ${userId} attempted to refer themselves`);
    return;
  }

  console.log(`Creating referral record: ${referrerId} -> ${userId}`);

  // Create referral record
  const db = getFirestore();
  const referralData: Omit<Referral, "id"> = {
    referrerId,
    refereeId: userId,
    referralCode,
    signedUpAt: Timestamp.now() as any,
    refereePurchasedAt: null,
    referrerPendingCredits: CREDITS_PER_REFERRAL,
    refereePendingCredits: CREDITS_PER_REFERRAL,
    referrerCreditAwarded: false,
    refereeCreditAwarded: false,
  };

  try {
    const referralRef = await db.collection(REFERRALS_COLLECTION).add(referralData);
    console.log(`Referral record created with ID: ${referralRef.id}`);
  } catch (error) {
    console.error("Error creating referral record:", error);
    throw error;
  }
}
