import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  attemptSync,
  processQueue,
  cancelRetries,
  calculateBackoffDelay,
  getRetryAttempt,
  resetSyncManagerState,
  setScheduleFn,
} from './sync-manager';
import {
  resetDbConnection,
  clearAll,
  clearSyncQueue,
  addToSyncQueue,
  getSyncQueue,
  getSyncQueueCount,
} from './storage';
import { SYNC_MAX_RETRIES, SYNC_BASE_DELAY_MS, SYNC_MAX_DELAY_MS } from './sync-config';

vi.mock('./github-settings', () => ({
  loadSettings: vi.fn(),
}));

vi.mock('./github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
}));

vi.mock('./github-sync', () => ({
  pushToGitHub: vi.fn(),
}));

import { loadSettings } from './github-settings';
import { pushToGitHub } from './github-sync';

const mockedLoadSettings = vi.mocked(loadSettings);
const mockedPush = vi.mocked(pushToGitHub);

/** Captured retry callbacks and their delays. */
let scheduledCallbacks: Array<{ callback: () => void; delay: number }>;

/** Mock schedule function that captures callbacks instead of using real timers. */
function mockScheduleFn(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
  scheduledCallbacks.push({ callback, delay });
  return scheduledCallbacks.length as unknown as ReturnType<typeof setTimeout>;
}

/** Fires the next scheduled retry callback and waits for its async work. */
async function fireNextRetry(): Promise<void> {
  const entry = scheduledCallbacks.shift();
  if (entry) {
    // The callback calls processQueue() which is async but not returned.
    // We need multiple microtask ticks for IndexedDB async work to fully settle.
    entry.callback();
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
}

describe('sync-manager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetDbConnection();
    await clearAll();
    await clearSyncQueue();
    resetSyncManagerState();
    scheduledCallbacks = [];
    setScheduleFn(mockScheduleFn as unknown as typeof setTimeout);
    mockedLoadSettings.mockReturnValue({ repo: 'owner/repo', pat: 'ghp_test' });
  });

  describe('calculateBackoffDelay', () => {
    it('should return base delay for first attempt', () => {
      expect(calculateBackoffDelay(0)).toBe(SYNC_BASE_DELAY_MS);
    });

    it('should double delay for each subsequent attempt', () => {
      expect(calculateBackoffDelay(1)).toBe(2000);
      expect(calculateBackoffDelay(2)).toBe(4000);
      expect(calculateBackoffDelay(3)).toBe(8000);
    });

    it('should cap delay at maximum', () => {
      expect(calculateBackoffDelay(20)).toBe(SYNC_MAX_DELAY_MS);
    });
  });

  describe('attemptSync', () => {
    it('should clear queue and dispatch connected on success', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'old entry' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await attemptSync('Added bottle');

      expect(await getSyncQueueCount()).toBe(0);
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('connected');
      expect(lastCall.pendingCount).toBe(0);
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should add to queue and dispatch offline on failure', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await attemptSync('Added bottle: Margaux 2015');

      expect(await getSyncQueueCount()).toBe(1);
      const queue = await getSyncQueue();
      expect(queue[0].action).toBe('Added bottle: Margaux 2015');
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('offline');
      expect(lastCall.pendingCount).toBe(1);
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should do nothing when settings are not configured', async () => {
      mockedLoadSettings.mockReturnValue(null);

      await attemptSync('Added bottle');

      expect(mockedPush).not.toHaveBeenCalled();
    });

    it('should schedule a retry on failure', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await attemptSync('Added bottle');

      expect(getRetryAttempt()).toBe(1);
      expect(scheduledCallbacks).toHaveLength(1);
    });
  });

  describe('processQueue', () => {
    it('should do nothing when queue is empty', async () => {
      await processQueue();

      expect(mockedPush).not.toHaveBeenCalled();
    });

    it('should do nothing when settings are not configured', async () => {
      mockedLoadSettings.mockReturnValue(null);
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });

      await processQueue();

      expect(mockedPush).not.toHaveBeenCalled();
    });

    it('should clear queue on successful push', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });

      await processQueue();

      expect(await getSyncQueueCount()).toBe(0);
    });

    it('should schedule retry on failed push', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await processQueue();

      expect(getRetryAttempt()).toBe(1);
      expect(scheduledCallbacks).toHaveLength(1);
    });

    it('should dispatch connected status on success', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await processQueue();

      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('connected');
      expect(lastCall.pendingCount).toBe(0);
      window.removeEventListener('sync-status-changed', handler);
    });
  });

  describe('retry logic', () => {
    it('should retry after scheduled callback and succeed', async () => {
      mockedPush
        .mockResolvedValueOnce({ status: 'error', message: 'Network error' })
        .mockResolvedValueOnce({ status: 'success', message: 'Done' });

      await attemptSync('Added bottle');
      expect(mockedPush).toHaveBeenCalledTimes(1);
      expect(scheduledCallbacks).toHaveLength(1);
      expect(scheduledCallbacks[0].delay).toBe(SYNC_BASE_DELAY_MS);

      await fireNextRetry();

      expect(mockedPush).toHaveBeenCalledTimes(2);
      expect(await getSyncQueueCount()).toBe(0);
    });

    it('should use exponential backoff delays', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await attemptSync('Added bottle');
      expect(scheduledCallbacks[0].delay).toBe(1000);

      await fireNextRetry();
      expect(scheduledCallbacks[0].delay).toBe(2000);

      await fireNextRetry();
      expect(scheduledCallbacks[0].delay).toBe(4000);

      await fireNextRetry();
      expect(scheduledCallbacks[0].delay).toBe(8000);
    });

    it('should dispatch error when max retries are exhausted', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await attemptSync('Added bottle');

      for (let i = 0; i < SYNC_MAX_RETRIES; i++) {
        await fireNextRetry();
      }

      // After max retries, no more retries should be scheduled
      expect(scheduledCallbacks).toHaveLength(0);
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('error');
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should reset retry count on successful retry', async () => {
      mockedPush
        .mockResolvedValueOnce({ status: 'error', message: 'Network error' })
        .mockResolvedValueOnce({ status: 'error', message: 'Network error' })
        .mockResolvedValueOnce({ status: 'success', message: 'Done' });

      await attemptSync('Added bottle');
      expect(getRetryAttempt()).toBe(1);

      await fireNextRetry();
      expect(getRetryAttempt()).toBe(2);

      await fireNextRetry();
      expect(getRetryAttempt()).toBe(0);
    });
  });

  describe('cancelRetries', () => {
    it('should prevent further retries', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await attemptSync('Added bottle');
      expect(getRetryAttempt()).toBe(1);
      expect(scheduledCallbacks).toHaveLength(1);

      cancelRetries();
      expect(getRetryAttempt()).toBe(0);
    });

    it('should reset retry attempt counter after multiple failures', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await attemptSync('Added bottle');
      await fireNextRetry();
      expect(getRetryAttempt()).toBe(2);

      cancelRetries();
      expect(getRetryAttempt()).toBe(0);
    });
  });
});
