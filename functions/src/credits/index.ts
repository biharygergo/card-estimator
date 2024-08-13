import {Filter, Timestamp, getFirestore} from "firebase-admin/firestore";
import {Credit, BundleName, CreditBundle, BundleWithCredits} from "../types";
import * as moment from "moment";
import {getAuth} from "firebase-admin/auth";
import {isAnonymousUser, isPremiumSubscriber} from "../shared/customClaims";
import {sendEmail} from "../email";
import {ALMOST_OUT_OF_CREDITS, OUT_OF_CREDITS} from "./emails";
import {getCurrentOrganization} from "../organizations";

const CREDITS_COLLECTION = "credits";
const BUNDLES_COLLECTION = "bundles";

export async function getAllCreditBundles(
    userId: string
): Promise<{ credits: Credit[]; bundles: BundleWithCredits[] }> {
  const allUserCredits = await getAllUserCredits(userId);
  const organization = await getCurrentOrganization(userId);
  const allOrganizationCredits = organization ?
    await getAllOrganizationCredits(organization.id) :
    [];
  const allUserBundles = await getAllUserBundles(userId);
  const allOrganizationBundles = organization ? await getAllOrganizationBundles(organization.id) : [];

  const allCredits = [...allUserCredits, ...allOrganizationCredits];
  const allBundles = [...allUserBundles, ...allOrganizationBundles];

  const bundles = allBundles.map((bundle) => ({
    ...bundle,
    credits: allCredits.filter((c) => c.bundleId === bundle.id),
  }));

  return {credits: allCredits, bundles};
}

export async function assignCreditsAsNeeded(userId: string) {
  if (
    !(await hasReceivedWelcomeBundle(userId)) &&
    !(await isPremiumSubscriber(userId))
  ) {
    const user = await getAuth().getUser(userId);
    const isExistingUser = moment(user.metadata.creationTime).isBefore(
        moment("2023-12-11")
    );
    await createBundle(
      isExistingUser ?
        BundleName.WELCOME_BUNDLE_EXISTING_USER :
        BundleName.WELCOME_BUNDLE_STANDARD,
      userId,
      null,
      undefined
    );
  }

  if (!(await isAnonymousUser(userId)) && !(await hasReceivedMonthlyBundle(userId))) {
    await createBundle(
        BundleName.MONTHLY_BUNDLE,
        userId,
        null,
        `${moment().format("MMMM")} bundle`,
        moment().startOf("month").toDate()
    );
  }
}

function getAllUserCredits(userId: string): Promise<Credit[]> {
  return getFirestore()
      .collection(`userDetails/${userId}/${CREDITS_COLLECTION}`)
      .orderBy("expiresAt", "asc")
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as Credit)
      );
}

function getAllOrganizationCredits(organizationId: string): Promise<Credit[]> {
  return getFirestore()
      .collection(`organizations/${organizationId}/${CREDITS_COLLECTION}`)
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as Credit)
      );
}

function getAllUserBundles(userId: string): Promise<CreditBundle[]> {
  return getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .orderBy("createdAt", "desc")
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as CreditBundle)
      );
}

export function getAllOrganizationBundles(organizationId: string): Promise<CreditBundle[]> {
  return getFirestore()
      .collection(`organizations/${organizationId}/${BUNDLES_COLLECTION}`)
      .orderBy("createdAt", "desc")
      .get()
      .then((snapshot) =>
        snapshot.docs.map((docSnapshot) => docSnapshot.data() as CreditBundle)
      );
}

export async function getValidCredits(userId: string): Promise<Credit[]> {
  const credits = await getAllUserCredits(userId);
  const organization = await getCurrentOrganization(userId);

  const organizationCredits = organization ?
    await getAllOrganizationCredits(organization.id) :
    [];

  return [...credits, ...organizationCredits].filter(
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

  return credits.at(-1);
}

export async function updateCreditUsage(
    credit: Credit,
    userId: string,
    roomId: string
) {
  const user = await getAuth().getUser(userId);
  if (user.email) {
    const creditCountBefore = (await getValidCredits(userId)).length;
    if (creditCountBefore === 2) {
      await sendEmail({...ALMOST_OUT_OF_CREDITS, to: user.email});
    }
    if (creditCountBefore === 1) {
      await sendEmail({...OUT_OF_CREDITS, to: user.email});
    }
  }

  const creditPath = credit.organizationId ?
    `organizations/${credit.organizationId}/${CREDITS_COLLECTION}/${credit.id}` :
    `userDetails/${userId}/${CREDITS_COLLECTION}/${credit.id}`;

  return getFirestore().doc(creditPath).update({usedForRoomId: roomId});
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

export async function hasReceivedMonthlyBundle(
    userId: string
): Promise<boolean> {
  return getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .where(
          Filter.and(
              Filter.where("name", "==", BundleName.MONTHLY_BUNDLE),
              Filter.where("createdAt", ">=", moment().startOf("month").toDate()),
              Filter.where("createdAt", "<=", moment().endOf("month").toDate())
          )
      )
      .get()
      .then((snapshot) => {
        return !snapshot.empty;
      });
}

export async function createBundle(
    bundleName: BundleName,
    userId: string,
    paymentId: string | null,
    displayName?: string,
    createdAt?: Date
) {
  const creditCount = getCreditCountForBundle(bundleName);

  const newBundleRef = await getFirestore()
      .collection(`userDetails/${userId}/${BUNDLES_COLLECTION}`)
      .doc();

  const creationTime = createdAt ?
    Timestamp.fromDate(createdAt) :
    (Timestamp.now() as any);

  const bundle: CreditBundle = {
    id: newBundleRef.id,
    userId,
    paymentId,
    createdAt: creationTime,
    name: bundleName,
    creditCount,
    expiresAt: getBundleExpirationDate(bundleName, creationTime) as any,
  };

  await newBundleRef.set(bundle);

  await createCredits(bundle, creationTime);

  return bundle;
}

export async function createCredits(
    bundle: CreditBundle,
    createdAt: Timestamp
) {
  await Promise.all(
      Array.from(Array(bundle.creditCount)).map(() => {
        const creditRef = getFirestore()
            .collection(`userDetails/${bundle.userId}/${CREDITS_COLLECTION}`)
            .doc();
        const credit: Credit = {
          id: creditRef.id,
          assignedToUserId: bundle.userId,
          bundleId: bundle.id,
          createdAt: createdAt as any,
          expiresAt: getBundleExpirationDate(bundle.name, createdAt) as any,
          isPaidCredit: !!bundle.paymentId,
        };
        return creditRef.set(credit);
      })
  );
}

export async function createOrganizationCreditBundle(
    organizationId: string,
    creditCount: number,
    userId: string,
    paymentId: string,
    createdAt?: Date
) {
  const newBundleRef = await getFirestore()
      .collection(`organizations/${organizationId}/${BUNDLES_COLLECTION}`)
      .doc();

  const creationTime = createdAt ?
    Timestamp.fromDate(createdAt) :
    (Timestamp.now() as any);

  const bundle: CreditBundle = {
    id: newBundleRef.id,
    userId,
    paymentId,
    createdAt: creationTime,
    name: BundleName.ORGANIZATION_BUNDLE,
    displayName: `Organization credits - ${creditCount} pieces`,
    creditCount,
    expiresAt: null,
  };

  await newBundleRef.set(bundle);

  await createOrganizationCredits(organizationId, bundle, creationTime);

  return bundle;
}

export async function createOrganizationCredits(
    organizationId: string,
    bundle: CreditBundle,
    createdAt: Timestamp
) {
  const batch = getFirestore().batch();
  new Array(bundle.creditCount).fill("").forEach(() => {
    const creditRef = getFirestore()
        .collection(`organizations/${organizationId}/${CREDITS_COLLECTION}`)
        .doc();
    const credit: Credit = {
      id: creditRef.id,
      assignedToUserId: bundle.userId,
      bundleId: bundle.id,
      createdAt: createdAt as any,
      organizationId,
      expiresAt: null,
      isPaidCredit: true,
    };
    batch.set(creditRef, credit);
  });

  await batch.commit();
}

function getCreditCountForBundle(bundleType: BundleName) {
  switch (bundleType) {
    case BundleName.WELCOME_BUNDLE_STANDARD:
      return 5;
    case BundleName.WELCOME_BUNDLE_EXISTING_USER:
      return 10;
    case BundleName.SMALL_BUNDLE:
      return 7;
    case BundleName.LARGE_BUNDLE:
      return 15;
    case BundleName.MEGA_BUNDLE:
      return 50;
    case BundleName.MONTHLY_BUNDLE:
      return 1;
    default:
      throw new Error("Unknown BundleName");
  }
}

function getBundleExpirationDate(
    bundleName: BundleName,
    creationDate: Timestamp
): Timestamp | null {
  switch (bundleName) {
    case BundleName.WELCOME_BUNDLE_STANDARD:
      return Timestamp.fromDate(
          moment(creationDate.toDate()).add(2, "months").toDate()
      );
    case BundleName.WELCOME_BUNDLE_EXISTING_USER:
    case BundleName.MONTHLY_BUNDLE:
      return Timestamp.fromDate(
          moment(creationDate.toDate()).add(1, "months").toDate()
      );
    default:
      return null;
  }
}
