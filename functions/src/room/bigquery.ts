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

async function insertIntoBigQuery(roomData: any[]) {
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
      e.errors.forEach((error: any) => console.error(error));
    }
    return;
  }
}

export async function updateRoomsTableInBigQuery() {
  try {
    await dataset.table(tableId).get();
    console.log("Table exists...");
    // If table exists, delete all rows
    const deleteQuery = `DELETE FROM \`${datasetId}.${tableId}\` WHERE true`;
    await client.query(deleteQuery);
    console.log("Deleting all rows...");
  } catch (e) {
    console.error(e);
    console.error("Table does not exist...");
    return;
  }

  const db = getFirestore();
  const roomsRef = db.collection("rooms");
  let startAfter = null;
  let processed = 0;
  let rooms = [];

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
      rooms.push({
        ...room,
        createdAt: new bigquery.BigQueryTimestamp(
            new Date((room.createdAt as any)._seconds * 1000)
        ),
        members: JSON.stringify(room.members),
        rounds: JSON.stringify(room.rounds),
        timer: JSON.stringify(room.timer),
        configuration: JSON.stringify(room.configuration),
        subscriptionMetadata: JSON.stringify(room.subscriptionMetadata),
        customCardSetValue: JSON.stringify(room.customCardSetValue),
      });
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

  console.log("Successfully uploaded rooms to BigQuery.");
}
