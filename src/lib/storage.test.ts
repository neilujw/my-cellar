import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  addBottle,
  getBottle,
  getAllBottles,
  updateBottle,
  deleteBottle,
  clearAll,
  resetDbConnection,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueue,
  getSyncQueueCount,
} from './storage';
import { HistoryAction, WineType, type Bottle, type SyncQueueEntry } from './types';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'bottle-1',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [
      {
        date: '2025-01-15',
        action: HistoryAction.Added,
        quantity: 3,
        price: { amount: 45, currency: 'EUR' },
      },
    ],
    ...overrides,
  };
}

beforeEach(async () => {
  // Reset the DB connection so each test gets a fresh singleton
  resetDbConnection();
  // Clear leftover data from previous tests
  await clearAll();
  await clearSyncQueue();
});

describe('addBottle', () => {
  it('should store a bottle and return its id', async () => {
    const bottle = makeBottle();

    const id = await addBottle(bottle);

    expect(id).toBe('bottle-1');
    const stored = await getBottle('bottle-1');
    expect(stored).toEqual(bottle);
  });
});

describe('getBottle', () => {
  it('should retrieve the correct bottle by id', async () => {
    const bottle = makeBottle();
    await addBottle(bottle);

    const result = await getBottle('bottle-1');

    expect(result).toEqual(bottle);
  });

  it('should return undefined for a non-existent id', async () => {
    const result = await getBottle('does-not-exist');

    expect(result).toBeUndefined();
  });
});

describe('getAllBottles', () => {
  it('should return all stored bottles', async () => {
    const bottle1 = makeBottle({ id: 'bottle-1' });
    const bottle2 = makeBottle({ id: 'bottle-2', name: 'Petrus', vintage: 2018 });
    await addBottle(bottle1);
    await addBottle(bottle2);

    const result = await getAllBottles();

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([bottle1, bottle2]));
  });

  it('should return an empty array when no bottles exist', async () => {
    const result = await getAllBottles();

    expect(result).toEqual([]);
  });
});

describe('updateBottle', () => {
  it('should modify an existing bottle', async () => {
    const bottle = makeBottle();
    await addBottle(bottle);

    const updated: Bottle = { ...bottle, rating: 9.5, notes: 'Outstanding' };
    await updateBottle(updated);

    const result = await getBottle('bottle-1');
    expect(result?.rating).toBe(9.5);
    expect(result?.notes).toBe('Outstanding');
  });
});

describe('deleteBottle', () => {
  it('should remove a bottle', async () => {
    const bottle = makeBottle();
    await addBottle(bottle);

    await deleteBottle('bottle-1');

    const result = await getBottle('bottle-1');
    expect(result).toBeUndefined();
  });
});

describe('clearAll', () => {
  it('should remove all bottles', async () => {
    await addBottle(makeBottle({ id: 'bottle-1' }));
    await addBottle(makeBottle({ id: 'bottle-2' }));

    await clearAll();

    const result = await getAllBottles();
    expect(result).toEqual([]);
  });
});

function makeQueueEntry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    timestamp: '2026-02-15T10:00:00.000Z',
    action: 'Added bottle: Chateau Margaux 2015',
    ...overrides,
  };
}

describe('addToSyncQueue', () => {
  it('should add an entry and return an auto-incremented id', async () => {
    const id = await addToSyncQueue(makeQueueEntry());

    expect(id).toBeGreaterThan(0);
  });

  it('should assign sequential ids to multiple entries', async () => {
    const id1 = await addToSyncQueue(makeQueueEntry());
    const id2 = await addToSyncQueue(makeQueueEntry({ action: 'Consumed bottle' }));

    expect(id2).toBeGreaterThan(id1);
  });
});

describe('getSyncQueue', () => {
  it('should return all pending queue entries', async () => {
    await addToSyncQueue(makeQueueEntry({ action: 'Action 1' }));
    await addToSyncQueue(makeQueueEntry({ action: 'Action 2' }));

    const entries = await getSyncQueue();

    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('Action 1');
    expect(entries[1].action).toBe('Action 2');
  });

  it('should return an empty array when the queue is empty', async () => {
    const entries = await getSyncQueue();

    expect(entries).toEqual([]);
  });
});

describe('clearSyncQueue', () => {
  it('should remove all queue entries', async () => {
    await addToSyncQueue(makeQueueEntry({ action: 'Action 1' }));
    await addToSyncQueue(makeQueueEntry({ action: 'Action 2' }));

    await clearSyncQueue();

    const entries = await getSyncQueue();
    expect(entries).toEqual([]);
  });
});

describe('getSyncQueueCount', () => {
  it('should return the number of pending entries', async () => {
    await addToSyncQueue(makeQueueEntry({ action: 'Action 1' }));
    await addToSyncQueue(makeQueueEntry({ action: 'Action 2' }));
    await addToSyncQueue(makeQueueEntry({ action: 'Action 3' }));

    const count = await getSyncQueueCount();

    expect(count).toBe(3);
  });

  it('should return zero when the queue is empty', async () => {
    const count = await getSyncQueueCount();

    expect(count).toBe(0);
  });
});
