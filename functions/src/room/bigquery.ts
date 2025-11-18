import * as bigquery from "@google-cloud/bigquery";
// import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {Room} from "../types";

// initializeApp();
// getFirestore().settings({ignoreUndefinedProperties: true});

const datasetId = "firestore_export";
const tableId = "rooms_data";
const FIRESTORE_BATCH_SIZE = 1000;

const client = new bigquery.BigQuery();
const dataset = client.dataset(datasetId);

// Define a TypeScript interface that matches the BigQuery schema
interface RoomBigQuerySchema {
  id: string;
  roomId: string;
  members: string; // JSON string
  rounds: string; // JSON string
  currentRound: number;
  isOpen: boolean;
  createdAt: bigquery.BigQueryTimestamp;
  cardSet: string;
  showPassOption: boolean;
  customCardSetValue: string;
  createdById: string;
  memberIds: string[];
  timer: string; // JSON string
  configuration: string; // JSON string
  subscriptionMetadata: string; // JSON string
  relatedRecurringMeetingLinkId?: string;
  isAsyncVotingEnabled?: boolean;
  isAnonymousVotingEnabled?: boolean;
}

export async function createTable() {
  const schema: bigquery.TableField[] = [
    {name: "id", type: "STRING"},
    {name: "roomId", type: "STRING"},
    {name: "members", type: "STRING"}, // JSON string
    {name: "rounds", type: "STRING"}, // JSON string
    {name: "currentRound", type: "INT64"},
    {name: "isOpen", type: "BOOL"},
    {name: "createdAt", type: "TIMESTAMP"},
    {name: "cardSet", type: "STRING"},
    {name: "showPassOption", type: "BOOL"},
    {name: "customCardSetValue", type: "STRING"},
    {name: "createdById", type: "STRING"},
    {name: "memberIds", type: "STRING", mode: "REPEATED"},
    {name: "timer", type: "STRING"}, // JSON string
    {name: "configuration", type: "STRING"}, // JSON string
    {name: "subscriptionMetadata", type: "STRING"}, // JSON string
    {
      name: "relatedRecurringMeetingLinkId",
      type: "STRING",
    },
    {name: "isAsyncVotingEnabled", type: "BOOL"},
    {name: "isAnonymousVotingEnabled", type: "BOOL"},
  ];
  // Create BigQuery table
  console.log("Creating table...");
  await dataset.createTable(tableId, {
    schema,
  });
}

async function insertIntoBigQuery(roomData: RoomBigQuerySchema[]) {
  // Insert data in batches to improve performance
  try {
    const batchSize = 500;
    for (let i = 0; i < roomData.length; i += batchSize) {
      const batch = roomData.slice(i, i + batchSize);
      await dataset.table(tableId).insert(batch);
    }
    console.log("Uploaded data to BigQuery...");
  } catch (e: any) {
    console.error("Error uploading rooms...");
    if (e.errors) {
      e.errors.forEach((error: any) => {
        if (error.row && error?.errors?.[0]?.reason !== "stopped") {
          console.error("Error details:", JSON.stringify(error, null, 2));
          console.error("Problematic row:", JSON.stringify(error.row, null, 2));
        }
      });
    } else {
      console.error("Full error:", JSON.stringify(e, null, 2));
    }
    return;
  }
}

// Helper to convert Room to BigQuery schema
function roomToRoomBigQuerySchema(room: Room): RoomBigQuerySchema {
  return {
    id: room.id,
    roomId: room.roomId,
    members: JSON.stringify(room.members),
    rounds: JSON.stringify(room.rounds),
    currentRound: room.currentRound ?? 0,
    isOpen: room.isOpen ?? true,
    createdAt: new bigquery.BigQueryTimestamp(
        new Date((room.createdAt as any)._seconds * 1000)
    ),
    cardSet: room.cardSet ?? "DEFAULT",
    showPassOption: room.showPassOption ?? false,
    customCardSetValue: room.customCardSetValue ? JSON.stringify(room.customCardSetValue) : "",
    createdById: room.createdById,
    memberIds: (Array.isArray(room.memberIds) && room.memberIds.length > 0 ? room.memberIds : room.members.map((member) => member.id)) || [],
    timer: room.timer ? JSON.stringify(room.timer) : "",
    configuration: room.configuration ? JSON.stringify(room.configuration) : "",
    subscriptionMetadata: room.subscriptionMetadata ? JSON.stringify(room.subscriptionMetadata) : "",
    relatedRecurringMeetingLinkId: room.relatedRecurringMeetingLinkId ?? "",
    isAsyncVotingEnabled: room.isAsyncVotingEnabled ?? false,
    isAnonymousVotingEnabled: room.isAnonymousVotingEnabled ?? false,
  };
}

interface SyncMetadata {
  lastSyncedAt: Date;
  syncType: "full" | "incremental";
  roomCount: number;
}

const SYNC_METADATA_COLLECTION = "sync_metadata";
const BIGQUERY_SYNC_DOC = "bigquery_rooms_sync";

// Get the last sync metadata
async function getLastSyncMetadata(): Promise<SyncMetadata | null> {
  const db = getFirestore();
  const metadataRef = db.collection(SYNC_METADATA_COLLECTION).doc(BIGQUERY_SYNC_DOC);
  const doc = await metadataRef.get();
  if (!doc.exists) {
    return null;
  }
  const data = doc.data();
  return {
    lastSyncedAt: data?.lastSyncedAt?.toDate() || new Date(0),
    syncType: data?.syncType || "full",
    roomCount: data?.roomCount || 0,
  };
}

// Update sync metadata
async function updateSyncMetadata(syncType: "full" | "incremental", roomCount: number) {
  const db = getFirestore();
  const metadataRef = db.collection(SYNC_METADATA_COLLECTION).doc(BIGQUERY_SYNC_DOC);
  await metadataRef.set({
    lastSyncedAt: new Date(),
    syncType,
    roomCount,
  });
}

/**
 * Full sync - drops and recreates the entire table
 * Use this for initial sync or periodic full refresh (e.g., weekly)
 */
export async function fullSyncRoomsToBigQuery() {
  try {
    console.log("Starting FULL sync to BigQuery...");

    // Drop the table if it exists
    try {
      console.log(`Dropping table ${tableId} if it exists...`);
      await dataset.table(tableId).delete();
      console.log(`Table ${tableId} dropped successfully.`);
    } catch (e) {
      console.log(`Table ${tableId} does not exist or could not be dropped:`, e);
    }

    // Create a new table
    console.log(`Creating new table ${tableId}...`);
    await createTable();

    const db = getFirestore();
    const roomsRef = db.collection("rooms");
    let startAfter = null;
    let processed = 0;
    let rooms: RoomBigQuerySchema[] = [];

    /* eslint-disable no-constant-condition */
    while (true) {
      let query = roomsRef.limit(FIRESTORE_BATCH_SIZE);
      if (startAfter) {
        query = query.startAfter(startAfter);
      }
      const snapshot = await query.get();
      console.log("Got data from firestore for batch: ", processed);
      if (snapshot.empty || processed > 200000) {
        break;
      }

      startAfter = snapshot.docs[snapshot.docs.length - 1];
      console.log("Starting next batch at:", startAfter.id);

      for (const doc of snapshot.docs) {
        const room = doc.data() as Room;
        rooms.push(roomToRoomBigQuerySchema(room));
      }

      processed += snapshot.size;

      if (rooms.length >= FIRESTORE_BATCH_SIZE) {
        await insertIntoBigQuery(rooms);
        rooms = [];
      }
    }

    if (rooms.length > 0) {
      await insertIntoBigQuery(rooms);
    }

    // Update sync metadata
    await updateSyncMetadata("full", processed);

    console.log(`Successfully completed FULL sync: ${processed} rooms uploaded to BigQuery.`);
  } catch (e) {
    console.error("Error during full sync:", e);
    throw e;
  }
}

/**
 * Incremental sync - only syncs rooms created/modified since last sync
 * Use this for daily/regular updates
 */
export async function incrementalSyncRoomsToBigQuery() {
  try {
    console.log("Starting INCREMENTAL sync to BigQuery...");

    // Get last sync metadata
    const lastSync = await getLastSyncMetadata();
    if (!lastSync) {
      console.log("No previous sync found. Running full sync instead...");
      return await fullSyncRoomsToBigQuery();
    }

    const lastSyncDate = lastSync.lastSyncedAt;
    console.log(`Last sync was at: ${lastSyncDate.toISOString()}`);

    const db = getFirestore();
    const roomsRef = db.collection("rooms");

    // Query rooms created after the last sync
    let startAfter = null;
    let processed = 0;
    let rooms: RoomBigQuerySchema[] = [];

    /* eslint-disable no-constant-condition */
    while (true) {
      let query = roomsRef
          .where("createdAt", ">", lastSyncDate)
          .orderBy("createdAt")
          .limit(FIRESTORE_BATCH_SIZE);

      if (startAfter) {
        query = query.startAfter(startAfter);
      }

      const snapshot = await query.get();
      console.log(`Got ${snapshot.size} rooms from firestore for batch: ${processed}`);

      if (snapshot.empty) {
        break;
      }

      startAfter = snapshot.docs[snapshot.docs.length - 1];

      for (const doc of snapshot.docs) {
        const room = doc.data() as Room;
        rooms.push(roomToRoomBigQuerySchema(room));
      }

      processed += snapshot.size;

      if (rooms.length >= FIRESTORE_BATCH_SIZE) {
        await insertIntoBigQuery(rooms);
        rooms = [];
      }
    }

    if (rooms.length > 0) {
      await insertIntoBigQuery(rooms);
    }

    // Update sync metadata
    await updateSyncMetadata("incremental", processed);

    console.log(`Successfully completed INCREMENTAL sync: ${processed} new rooms uploaded to BigQuery.`);
  } catch (e) {
    console.error("Error during incremental sync:", e);
    throw e;
  }
}

/**
 * Main function for backward compatibility
 * Defaults to incremental sync
 */
export async function updateRoomsTableInBigQuery() {
  return await incrementalSyncRoomsToBigQuery();
}
