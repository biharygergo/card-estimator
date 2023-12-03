import {Timestamp, getFirestore} from "firebase-admin/firestore";
import {Credit, BundleName, CreditBundle, BundleWithCredits} from "../types";
import * as moment from "moment";
import {getAuth} from "firebase-admin/auth";
import {isPremiumSubscriber} from "../shared/customClaims";

const CREDITS_COLLECTION = "credits";
const BUNDLES_COLLECTION = "bundles";

export async function getAllCreditBundles(
    userId: string
): Promise<BundleWithCredits[]> {
  const allCredits = await getAllCredits(userId);
  const allBundles = await getAllBundles(userId);

  return allBundles.map((bundle) => ({
    ...bundle,
    credits: allCredits.filter((c) => c.bundleId === bundle.id),
  }));
}

export async function assignWelcomeCreditsIfNeeded(userId: string) {
  if (
    !(await hasReceivedWelcomeBundle(userId)) &&
    !(await isPremiumSubscriber(userId))
  ) {
    const user = await getAuth().getUser(userId);
    if (moment(user.metadata.creationTime).isBefore(moment("2023-12-02"))) {
      await createBundle(
          BundleName.WELCOME_BUNDLE_EXISTING_USER,
          userId,
          null,
          true
      );
    } else {
      await createBundle(
          BundleName.WELCOME_BUNDLE_STANDARD,
          userId,
          null,
          true
      );
    }
  }
}

function getAllCredits(userId: string): Promise<Credit[]> {
  return getFirestore()
      .collection(`userDetails/${userId}/${CREDITS_COLLECTION}`)
      .orderBy("expiresAt", "asc")
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as Credit)
      );
}

function getAllBundles(userId: string): Promise<CreditBundle[]> {
  return getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .orderBy("expiresAt", "asc")
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as CreditBundle)
      );
}

export async function getValidCredits(userId: string): Promise<Credit[]> {
  const credits = await getAllCredits(userId);

  return credits.filter(
      (credit) =>
        !credit.usedForRoomId &&
      (!credit.expiresAt ||
        moment(credit.expiresAt?.toDate()).isAfter(moment()))
  );
}

export async function getCreditForNewRoom(
    userId: string
): Promise<Credit | undefined> {
  const credits = (await getValidCredits(userId)).sort((a, b) => {
    if (!a.expiresAt) {
      return -1;
    } else if (!b.expiresAt) {
      return 1;
    }

    return a.expiresAt.seconds - b.expiresAt.seconds;
  });

  return credits.at(0);
}

export async function updateCreditUsage(
    creditId: string,
    userId: string,
    roomId: string
) {
  return getFirestore()
      .doc(`userDetails/${userId}/${CREDITS_COLLECTION}/${creditId}`)
      .update({usedForRoomId: roomId});
}

export async function hasReceivedWelcomeBundle(
    userId: string
): Promise<boolean> {
  return getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .where("name", "in", [
        BundleName.WELCOME_BUNDLE_EXISTING_USER,
        BundleName.WELCOME_BUNDLE_STANDARD,
      ])
      .get()
      .then((snapshot) => {
        return !snapshot.empty;
      });
}

export async function createBundle(
    bundleName: BundleName,
    userId: string,
    paymentId: string | null,
    createCreditsNow?: boolean
) {
  const creditCount = getCreditCountForBundle(bundleName);

  const newBundleRef = await getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .doc();
  const bundle: CreditBundle = {
    id: newBundleRef.id,
    userId,
    paymentId,
    createdAt: Timestamp.now() as any,
    name: bundleName,
    creditCount,
    expiresAt: getBundleExpirationDate(bundleName) as any,
  };

  await newBundleRef.set(bundle);

  if (createCreditsNow) {
    await createCredits(bundle);
  }

  return bundle;
}

export async function createCredits(bundle: CreditBundle) {
  await Promise.all(
      Array.from(Array(bundle.creditCount)).map(() => {
        const creditRef = getFirestore()
            .collection(`userDetails/${bundle.userId}/${CREDITS_COLLECTION}`)
            .doc();
        const credit: Credit = {
          id: creditRef.id,
          assignedToUserId: bundle.userId,
          bundleId: bundle.id,
          createdAt: Timestamp.now() as any,
          expiresAt: getBundleExpirationDate(bundle.name) as any,
        };
        return creditRef.set(credit);
      })
  );
}

function getCreditCountForBundle(bundleType: BundleName) {
  switch (bundleType) {
    case BundleName.WELCOME_BUNDLE_STANDARD:
      return 5;
    case BundleName.WELCOME_BUNDLE_EXISTING_USER:
      return 10;
    case BundleName.SMALL_BUNDLE:
      return 5;
    case BundleName.LARGE_BUNDLE:
      return 10;
    case BundleName.MEGA_BUNDLE:
      return 50;
    default:
      throw new Error("Unknown BundleName");
  }
}

function getBundleExpirationDate(bundleName: BundleName): Timestamp | null {
  switch (bundleName) {
    case BundleName.WELCOME_BUNDLE_STANDARD:
      return Timestamp.fromDate(moment().add(2, "months").toDate());
    case BundleName.WELCOME_BUNDLE_EXISTING_USER:
      return Timestamp.fromDate(moment().add(3, "months").toDate());
    default:
      return null;
  }
}
