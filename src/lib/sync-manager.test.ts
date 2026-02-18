import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
  enqueueMutation,
  manualPush,
  manualPull,
  isSyncing,
  resetSyncManagerState,
  cancelRetries,
} from './sync-manager';
import {
  resetDbConnection,
  clearAll,
  clearSyncQueue,
  addToSyncQueue,
  getSyncQueueCount,
} from './storage';

vi.mock('./github-settings', () => ({
  loadSettings: vi.fn(),
  getLastSyncedCommitSha: vi.fn(),
  setLastSyncedCommitSha: vi.fn(),
}));

vi.mock('./github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
}));

vi.mock('./github-sync', () => ({
  pushToGitHub: vi.fn(),
  pullFromGitHub: vi.fn(),
}));

vi.mock('./toast.svelte', () => ({
  toastError: vi.fn(),
}));

import { loadSettings, getLastSyncedCommitSha, setLastSyncedCommitSha } from './github-settings';
import { pushToGitHub, pullFromGitHub } from './github-sync';
import { toastError } from './toast.svelte';

const mockedLoadSettings = vi.mocked(loadSettings);
const mockedGetLastSyncedSha = vi.mocked(getLastSyncedCommitSha);
const mockedSetLastSyncedSha = vi.mocked(setLastSyncedCommitSha);
const mockedPush = vi.mocked(pushToGitHub);
const mockedPull = vi.mocked(pullFromGitHub);
const mockedToastError = vi.mocked(toastError);

describe('sync-manager', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    resetDbConnection();
    await clearAll();
    await clearSyncQueue();
    resetSyncManagerState();
    mockedLoadSettings.mockReturnValue({ repo: 'owner/repo', pat: 'ghp_test' });
  });

  describe('enqueueMutation', () => {
    it('should add an entry to the sync queue', async () => {
      await enqueueMutation('Added bottle: Margaux 2015');

      expect(await getSyncQueueCount()).toBe(1);
    });

    it('should dispatch sync-status-changed with updated count', async () => {
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await enqueueMutation('Added bottle');

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0].detail.pendingCount).toBe(1);
      expect(handler.mock.calls[0][0].detail.status).toBe('connected');
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should dispatch not-configured status when no settings exist', async () => {
      mockedLoadSettings.mockReturnValue(null);
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await enqueueMutation('Added bottle');

      expect(handler.mock.calls[0][0].detail.status).toBe('not-configured');
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should increment count with each mutation', async () => {
      await enqueueMutation('First');
      await enqueueMutation('Second');
      await enqueueMutation('Third');

      expect(await getSyncQueueCount()).toBe(3);
    });

    it('should not call any GitHub API', async () => {
      await enqueueMutation('Added bottle');

      expect(mockedPush).not.toHaveBeenCalled();
      expect(mockedPull).not.toHaveBeenCalled();
    });
  });

  describe('manualPush', () => {
    it('should clear queue and dispatch connected on success', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done', commitSha: 'sha-1' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await manualPush();

      expect(await getSyncQueueCount()).toBe(0);
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('connected');
      expect(lastCall.pendingCount).toBe(0);
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should store commit SHA after successful push', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done', commitSha: 'new-sha' });

      await manualPush();

      expect(mockedSetLastSyncedSha).toHaveBeenCalledWith('new-sha');
    });

    it('should dispatch conflict status when remote SHA has changed', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'conflict', message: 'Remote has changed' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await manualPush();

      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('conflict');
      // Queue should NOT be cleared on conflict
      expect(await getSyncQueueCount()).toBe(1);
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should dispatch error and show toast on push failure', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await manualPush();

      expect(mockedToastError).toHaveBeenCalledWith('Network error');
      expect(await getSyncQueueCount()).toBe(1);
    });

    it('should dispatch error and show toast on exception', async () => {
      mockedPush.mockRejectedValue(new Error('Connection refused'));

      await manualPush();

      expect(mockedToastError).toHaveBeenCalledWith('Connection refused');
    });

    it('should do nothing when settings are not configured', async () => {
      mockedLoadSettings.mockReturnValue(null);

      await manualPush();

      expect(mockedPush).not.toHaveBeenCalled();
    });

    it('should pass last synced SHA to pushToGitHub', async () => {
      mockedGetLastSyncedSha.mockReturnValue('stored-sha');
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });

      await manualPush();

      expect(mockedPush).toHaveBeenCalledWith(
        expect.anything(),
        'owner/repo',
        expect.anything(),
        'stored-sha',
      );
    });

    it('should not schedule any retries on failure', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Network error' });

      await manualPush();

      // No retry — just error status
      expect(mockedPush).toHaveBeenCalledTimes(1);
    });
  });

  describe('manualPull', () => {
    it('should replace local data and clear queue on success', async () => {
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });
      mockedPull.mockResolvedValue({
        status: 'success',
        message: 'Pulled 2 bottles',
        bottles: [
          { id: 'b1', name: 'Wine', vintage: 2020, type: 'red' as never, country: 'FR', grapeVariety: [], history: [] },
        ],
        commitSha: 'pull-sha',
      });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);

      await manualPull();

      expect(await getSyncQueueCount()).toBe(0);
      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('connected');
      expect(mockedSetLastSyncedSha).toHaveBeenCalledWith('pull-sha');
      window.removeEventListener('sync-status-changed', handler);
    });

    it('should dispatch error and show toast on pull failure', async () => {
      mockedPull.mockResolvedValue({ status: 'error', message: 'Pull failed: API error' });

      await manualPull();

      expect(mockedToastError).toHaveBeenCalledWith('Pull failed: API error');
    });

    it('should dispatch error on exception', async () => {
      mockedPull.mockRejectedValue(new Error('Network failure'));

      await manualPull();

      expect(mockedToastError).toHaveBeenCalledWith('Network failure');
    });

    it('should do nothing when settings are not configured', async () => {
      mockedLoadSettings.mockReturnValue(null);

      await manualPull();

      expect(mockedPull).not.toHaveBeenCalled();
    });
  });

  describe('sync lock', () => {
    /** Yield multiple microtask ticks for IndexedDB async operations. */
    async function flushAsync(): Promise<void> {
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    it('should skip manualPush when another sync is in flight', async () => {
      let resolveFirst!: (value: { status: 'success'; message: string }) => void;
      mockedPush.mockImplementation(
        () => new Promise((resolve) => { resolveFirst = resolve; }),
      );

      const first = manualPush();
      await flushAsync();
      expect(isSyncing()).toBe(true);

      await manualPush();
      expect(mockedPush).toHaveBeenCalledTimes(1);

      resolveFirst({ status: 'success', message: 'Done' });
      await first;
      expect(isSyncing()).toBe(false);
    });

    it('should allow new sync after previous completes', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });

      await manualPush();
      expect(isSyncing()).toBe(false);

      await manualPush();
      expect(mockedPush).toHaveBeenCalledTimes(2);
    });
  });

  describe('cancelRetries', () => {
    it('should be a no-op function', () => {
      // cancelRetries is kept as a no-op stub
      expect(() => cancelRetries()).not.toThrow();
    });
  });
});
