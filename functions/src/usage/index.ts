import {Timestamp, getFirestore} from "firebase-admin/firestore";

// TODO: move to shared types
export interface MeteredUsage {
  createdAt: Timestamp;
  type: "chatgpt-query";
  subscription: "premium" | "basic";
}

export async function getChatGptUsageThisMonth(
    userId: string
): Promise<number> {
  const userMeteredUsageCollection = await getFirestore()
      .collection("userDetails")
      .doc(userId)
      .collection("meteredUsage");

  const date = new Date();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const summaryUsageThisMonthRef = userMeteredUsageCollection
      .where("createdAt", ">=", Timestamp.fromDate(firstDayOfMonth))
      .where("type", "==", "chatgpt-query");

  const usageCountThisMonth: number = (
    await summaryUsageThisMonthRef.count().get()
  ).data().count;

  return usageCountThisMonth;
}

export function saveMeteredUsage(userId: string, usage: MeteredUsage) {
  const userMeteredUsageCollection = getFirestore()
      .collection("userDetails")
      .doc(userId)
      .collection("meteredUsage");

  return userMeteredUsageCollection.add(usage);
}
