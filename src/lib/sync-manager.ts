import { createGitHubClient } from './github-client';
import { loadSettings, getLastSyncedCommitSha, setLastSyncedCommitSha } from './github-settings';
import { pushToGitHub, pullFromGitHub } from './github-sync';
import {
  getAllBottles,
  addToSyncQueue,
  clearSyncQueue,
  getSyncQueueCount,
  clearAll,
  addBottle,
} from './storage';
import type { SyncStatus } from './types';
import { toastError } from './toast.svelte';

let syncing = false;

/** Dispatches a sync-status-changed event to update the header indicator. */
function dispatchSyncStatus(status: SyncStatus, pendingCount: number = 0): void {
  window.dispatchEvent(
    new CustomEvent('sync-status-changed', { detail: { status, pendingCount } }),
  );
}

/**
 * Enqueues a mutation description in the sync queue and dispatches the updated count.
 * This is the single entry-point for all mutation handlers to record a pending change.
 */
export async function enqueueMutation(description: string): Promise<void> {
  await addToSyncQueue({
    timestamp: new Date().toISOString(),
    action: description,
  });
  const count = await getSyncQueueCount();
  const settings = loadSettings();
  dispatchSyncStatus(settings ? 'connected' : 'not-configured', count);
}

/**
 * Pushes the full local bottle collection to GitHub.
 * Clears the sync queue on success. On conflict, dispatches 'conflict' status.
 * On failure, dispatches 'error' status and shows an error toast.
 */
export async function manualPush(): Promise<void> {
  const settings = loadSettings();
  if (!settings) return;
  if (syncing) return;

  syncing = true;
  try {
    const pendingCount = await getSyncQueueCount();
    dispatchSyncStatus('syncing', pendingCount);

    const client = createGitHubClient(settings.pat);
    const bottles = await getAllBottles();
    const lastSyncedSha = getLastSyncedCommitSha();
    const result = await pushToGitHub(client, settings.repo, bottles, lastSyncedSha);

    if (result.status === 'success') {
      await clearSyncQueue();
      if (result.commitSha) {
        setLastSyncedCommitSha(result.commitSha);
      }
      dispatchSyncStatus('connected', 0);
    } else if (result.status === 'conflict') {
      dispatchSyncStatus('conflict', pendingCount);
    } else {
      dispatchSyncStatus('error', pendingCount);
      toastError(result.message);
    }
  } catch (error: unknown) {
    const pendingCount = await getSyncQueueCount();
    dispatchSyncStatus('error', pendingCount);
    toastError(error instanceof Error ? error.message : 'Push failed unexpectedly');
  } finally {
    syncing = false;
  }
}

/**
 * Pulls all bottles from GitHub, replacing local data and clearing the sync queue.
 * On failure, dispatches 'error' status and shows an error toast.
 */
export async function manualPull(): Promise<void> {
  const settings = loadSettings();
  if (!settings) return;
  if (syncing) return;

  syncing = true;
  try {
    dispatchSyncStatus('syncing', 0);

    const client = createGitHubClient(settings.pat);
    const pullResult = await pullFromGitHub(client, settings.repo);

    if (pullResult.status === 'success') {
      if (pullResult.bottles && pullResult.bottles.length > 0) {
        await clearAll();
        for (const bottle of pullResult.bottles) {
          await addBottle(bottle);
        }
      }
      await clearSyncQueue();
      if (pullResult.commitSha) {
        setLastSyncedCommitSha(pullResult.commitSha);
      }
      dispatchSyncStatus('connected', 0);
    } else {
      dispatchSyncStatus('error', 0);
      toastError(pullResult.message);
    }
  } catch (error: unknown) {
    dispatchSyncStatus('error', 0);
    toastError(error instanceof Error ? error.message : 'Pull failed unexpectedly');
  } finally {
    syncing = false;
  }
}

/** No-op stub kept for backward compatibility with ConflictModal. */
export function cancelRetries(): void {
  // No-op: retry logic has been removed in favor of manual sync.
}

/** Returns whether a sync operation is currently in progress. Exposed for testing. */
export function isSyncing(): boolean {
  return syncing;
}

/** Resets internal state. Only intended for use in tests. */
export function resetSyncManagerState(): void {
  syncing = false;
}
