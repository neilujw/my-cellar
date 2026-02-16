import { createGitHubClient } from './github-client';
import { loadSettings, getLastSyncedCommitSha, setLastSyncedCommitSha } from './github-settings';
import { pushToGitHub } from './github-sync';
import {
  getAllBottles,
  addToSyncQueue,
  clearSyncQueue,
  getSyncQueueCount,
  getSyncQueue,
} from './storage';
import { SYNC_MAX_RETRIES, SYNC_BASE_DELAY_MS, SYNC_MAX_DELAY_MS } from './sync-config';
import type { SyncStatus } from './types';

let retryAttempt = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** Replaceable timer function for testability. */
let scheduleFn: typeof setTimeout = setTimeout;

/**
 * Calculates the exponential backoff delay for a given attempt.
 * Formula: min(baseDelay * 2^attempt, maxDelay)
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.min(SYNC_BASE_DELAY_MS * Math.pow(2, attempt), SYNC_MAX_DELAY_MS);
}

/** Dispatches a sync-status-changed event to update the header indicator. */
function dispatchSyncStatus(status: SyncStatus, pendingCount: number): void {
  window.dispatchEvent(
    new CustomEvent('sync-status-changed', { detail: { status, pendingCount } }),
  );
}

/**
 * Attempts to push local state to GitHub.
 * On failure, adds the action to the sync queue and schedules a retry.
 * On conflict, dispatches conflict status and stops (no retry).
 */
export async function attemptSync(actionDescription: string): Promise<void> {
  const settings = loadSettings();
  if (!settings) return;

  try {
    dispatchSyncStatus('syncing', await getSyncQueueCount());

    const client = createGitHubClient(settings.pat);
    const bottles = await getAllBottles();
    const lastSyncedSha = getLastSyncedCommitSha();
    const result = await pushToGitHub(client, settings.repo, bottles, lastSyncedSha);

    if (result.status === 'success') {
      retryAttempt = 0;
      await clearSyncQueue();
      if (result.commitSha) {
        setLastSyncedCommitSha(result.commitSha);
      }
      dispatchSyncStatus('connected', 0);
    } else if (result.status === 'conflict') {
      dispatchSyncStatus('conflict', 0);
    } else {
      await addToSyncQueue({
        timestamp: new Date().toISOString(),
        action: actionDescription,
      });
      const pendingCount = await getSyncQueueCount();
      dispatchSyncStatus('offline', pendingCount);
      scheduleRetry();
    }
  } catch {
    await addToSyncQueue({
      timestamp: new Date().toISOString(),
      action: actionDescription,
    });
    const pendingCount = await getSyncQueueCount();
    dispatchSyncStatus('error', pendingCount);
  }
}

/** Schedules a retry attempt with exponential backoff. */
function scheduleRetry(): void {
  if (retryAttempt >= SYNC_MAX_RETRIES) {
    handleMaxRetriesExhausted();
    return;
  }

  const delay = calculateBackoffDelay(retryAttempt);
  retryAttempt++;

  retryTimer = scheduleFn(() => {
    retryTimer = null;
    processQueue();
  }, delay);
}

/** Called when all retry attempts are exhausted. */
async function handleMaxRetriesExhausted(): Promise<void> {
  const pendingCount = await getSyncQueueCount();
  dispatchSyncStatus('error', pendingCount);
}

/**
 * Processes queued sync items by attempting a push.
 * Called on app startup and after retry timer fires.
 * On conflict, dispatches conflict status and stops processing.
 */
export async function processQueue(): Promise<void> {
  const settings = loadSettings();
  if (!settings) return;

  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  try {
    const pendingCount = await getSyncQueueCount();
    dispatchSyncStatus('syncing', pendingCount);

    const client = createGitHubClient(settings.pat);
    const bottles = await getAllBottles();
    const lastSyncedSha = getLastSyncedCommitSha();
    const result = await pushToGitHub(client, settings.repo, bottles, lastSyncedSha);

    if (result.status === 'success') {
      retryAttempt = 0;
      await clearSyncQueue();
      if (result.commitSha) {
        setLastSyncedCommitSha(result.commitSha);
      }
      dispatchSyncStatus('connected', 0);
    } else if (result.status === 'conflict') {
      dispatchSyncStatus('conflict', 0);
    } else {
      dispatchSyncStatus('offline', pendingCount);
      scheduleRetry();
    }
  } catch {
    const pendingCount = await getSyncQueueCount();
    dispatchSyncStatus('error', pendingCount);
  }
}

/** Cancels any pending retry timers and resets retry state. */
export function cancelRetries(): void {
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  retryAttempt = 0;
}

/** Returns the current retry attempt count. Exposed for testing. */
export function getRetryAttempt(): number {
  return retryAttempt;
}

/** Replaces the timer function used for scheduling retries. For testing only. */
export function setScheduleFn(fn: typeof setTimeout): void {
  scheduleFn = fn;
}

/** Resets internal state. Only intended for use in tests. */
export function resetSyncManagerState(): void {
  cancelRetries();
  retryAttempt = 0;
  scheduleFn = setTimeout;
}
