import type { Bottle } from './types';
import { createConsumeHistoryEntry, createRemoveHistoryEntry, applyHistoryEntry } from './bottle-utils';
import { updateBottle } from './storage';
import { attemptSync } from './sync-manager';
import { toastSuccess } from './toast.svelte';

/**
 * Consumes one bottle: creates a "consumed" history entry, updates IndexedDB,
 * triggers GitHub sync, and shows a success toast.
 *
 * @param bottle - A plain (non-proxy) bottle object.
 * @returns The updated bottle with the new history entry.
 */
export async function consumeBottle(bottle: Bottle): Promise<Bottle> {
  const entry = createConsumeHistoryEntry();
  const updated = applyHistoryEntry(bottle, entry);

  await updateBottle(updated);
  attemptSync(`Consumed 1× ${bottle.name} ${bottle.vintage}`);
  toastSuccess(`Consumed 1× ${bottle.name} ${bottle.vintage}`);

  return updated;
}

/**
 * Removes one bottle: creates a "removed" history entry, updates IndexedDB,
 * triggers GitHub sync, and shows a success toast.
 *
 * @param bottle - A plain (non-proxy) bottle object.
 * @returns The updated bottle with the new history entry.
 */
export async function removeBottle(bottle: Bottle): Promise<Bottle> {
  const entry = createRemoveHistoryEntry();
  const updated = applyHistoryEntry(bottle, entry);

  await updateBottle(updated);
  attemptSync(`Removed 1× ${bottle.name} ${bottle.vintage}`);
  toastSuccess(`Removed 1× ${bottle.name} ${bottle.vintage}`);

  return updated;
}
