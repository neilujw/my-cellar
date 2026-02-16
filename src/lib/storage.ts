import { openDB, type IDBPDatabase } from 'idb';

import type { Bottle, SyncQueueEntry } from './types';

const DB_NAME = 'my-cellar';
const DB_VERSION = 2;
const BOTTLES_STORE = 'bottles';
const SYNC_QUEUE_STORE = 'sync-queue';

/** Schema definition for the My Cellar IndexedDB database. */
interface MyCellarDB {
  bottles: {
    key: string;
    value: Bottle;
    indexes: {
      type: string;
      vintage: number;
      name: string;
    };
  };
  'sync-queue': {
    key: number;
    value: SyncQueueEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<MyCellarDB>> | null = null;

/**
 * Returns a singleton connection to the IndexedDB database.
 * Creates the database and object stores on first call.
 */
function getDb(): Promise<IDBPDatabase<MyCellarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MyCellarDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(BOTTLES_STORE, { keyPath: 'id' });
          store.createIndex('type', 'type');
          store.createIndex('vintage', 'vintage');
          store.createIndex('name', 'name');
        }
        if (oldVersion < 2) {
          db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
        }
      },
    }).catch((error) => {
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Adds a bottle to the database.
 * @returns The id of the stored bottle.
 */
export async function addBottle(bottle: Bottle): Promise<string> {
  const db = await getDb();
  await db.put(BOTTLES_STORE, bottle);
  return bottle.id;
}

/**
 * Retrieves a single bottle by its id.
 * @returns The bottle, or `undefined` if not found.
 */
export async function getBottle(id: string): Promise<Bottle | undefined> {
  const db = await getDb();
  return db.get(BOTTLES_STORE, id);
}

/** Retrieves all bottles from the database. */
export async function getAllBottles(): Promise<Bottle[]> {
  const db = await getDb();
  return db.getAll(BOTTLES_STORE);
}

/** Updates an existing bottle in the database. */
export async function updateBottle(bottle: Bottle): Promise<void> {
  const db = await getDb();
  await db.put(BOTTLES_STORE, bottle);
}

/** Deletes a bottle by its id. */
export async function deleteBottle(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(BOTTLES_STORE, id);
}

/** Removes all bottles from the database. */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear(BOTTLES_STORE);
}

/** Adds an entry to the sync queue. */
export async function addToSyncQueue(entry: SyncQueueEntry): Promise<number> {
  const db = await getDb();
  return db.add(SYNC_QUEUE_STORE, entry) as Promise<number>;
}

/** Returns all pending sync queue entries. */
export async function getSyncQueue(): Promise<SyncQueueEntry[]> {
  const db = await getDb();
  return db.getAll(SYNC_QUEUE_STORE);
}

/** Removes all entries from the sync queue. */
export async function clearSyncQueue(): Promise<void> {
  const db = await getDb();
  await db.clear(SYNC_QUEUE_STORE);
}

/** Returns the number of pending sync queue entries. */
export async function getSyncQueueCount(): Promise<number> {
  const db = await getDb();
  return db.count(SYNC_QUEUE_STORE);
}

/**
 * Resets the database connection singleton.
 * Only intended for use in tests to ensure a fresh database per test.
 */
export function resetDbConnection(): void {
  dbPromise = null;
}
