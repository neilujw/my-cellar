import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { consumeBottle, removeBottle } from './bottle-actions';
import { HistoryAction, WineType, type Bottle } from './types';
import * as storage from './storage';
import * as syncManager from './sync-manager';
import * as toast from './toast.svelte';

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
      { date: '2026-01-15', action: HistoryAction.Added, quantity: 3 },
    ],
    ...overrides,
  };
}

describe('consumeBottle', () => {
  beforeEach(() => {
    storage.resetDbConnection();
    vi.spyOn(storage, 'updateBottle').mockResolvedValue();
    vi.spyOn(syncManager, 'attemptSync').mockResolvedValue(null);
    vi.spyOn(toast, 'toastSuccess').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return updated bottle with consumed history entry', async () => {
    const bottle = makeBottle();

    const result = await consumeBottle(bottle);

    expect(result.history).toHaveLength(2);
    expect(result.history[1].action).toBe(HistoryAction.Consumed);
    expect(result.history[1].quantity).toBe(1);
  });

  it('should call updateBottle with the updated bottle', async () => {
    const bottle = makeBottle();

    const result = await consumeBottle(bottle);

    expect(storage.updateBottle).toHaveBeenCalledOnce();
    expect(storage.updateBottle).toHaveBeenCalledWith(result);
  });

  it('should trigger sync with a descriptive action', async () => {
    const bottle = makeBottle();

    await consumeBottle(bottle);

    expect(syncManager.attemptSync).toHaveBeenCalledOnce();
    expect(syncManager.attemptSync).toHaveBeenCalledWith('Consumed 1× Chateau Margaux 2015');
  });

  it('should show a success toast', async () => {
    const bottle = makeBottle();

    await consumeBottle(bottle);

    expect(toast.toastSuccess).toHaveBeenCalledOnce();
    expect(toast.toastSuccess).toHaveBeenCalledWith('Consumed 1× Chateau Margaux 2015');
  });

  it('should not mutate the original bottle', async () => {
    const bottle = makeBottle();
    const originalHistoryLength = bottle.history.length;

    await consumeBottle(bottle);

    expect(bottle.history).toHaveLength(originalHistoryLength);
  });
});

describe('removeBottle', () => {
  beforeEach(() => {
    storage.resetDbConnection();
    vi.spyOn(storage, 'updateBottle').mockResolvedValue();
    vi.spyOn(syncManager, 'attemptSync').mockResolvedValue(null);
    vi.spyOn(toast, 'toastSuccess').mockReturnValue(1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return updated bottle with removed history entry', async () => {
    const bottle = makeBottle();

    const result = await removeBottle(bottle);

    expect(result.history).toHaveLength(2);
    expect(result.history[1].action).toBe(HistoryAction.Removed);
    expect(result.history[1].quantity).toBe(1);
  });

  it('should call updateBottle with the updated bottle', async () => {
    const bottle = makeBottle();

    const result = await removeBottle(bottle);

    expect(storage.updateBottle).toHaveBeenCalledOnce();
    expect(storage.updateBottle).toHaveBeenCalledWith(result);
  });

  it('should trigger sync with a descriptive action', async () => {
    const bottle = makeBottle();

    await removeBottle(bottle);

    expect(syncManager.attemptSync).toHaveBeenCalledOnce();
    expect(syncManager.attemptSync).toHaveBeenCalledWith('Removed 1× Chateau Margaux 2015');
  });

  it('should show a success toast', async () => {
    const bottle = makeBottle();

    await removeBottle(bottle);

    expect(toast.toastSuccess).toHaveBeenCalledOnce();
    expect(toast.toastSuccess).toHaveBeenCalledWith('Removed 1× Chateau Margaux 2015');
  });

  it('should propagate errors from updateBottle', async () => {
    vi.spyOn(storage, 'updateBottle').mockRejectedValue(new Error('DB error'));
    const bottle = makeBottle();

    await expect(removeBottle(bottle)).rejects.toThrow('DB error');
  });
});
