import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import SyncSection from './SyncSection.svelte';

vi.mock('../lib/github-settings', () => ({
  loadSettings: vi.fn(),
  getLastSyncedCommitSha: vi.fn().mockReturnValue(null),
  setLastSyncedCommitSha: vi.fn(),
}));

vi.mock('../lib/github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
}));

vi.mock('../lib/github-sync', () => ({
  pushToGitHub: vi.fn(),
  pullFromGitHub: vi.fn(),
}));

vi.mock('../lib/storage', () => ({
  getAllBottles: vi.fn().mockResolvedValue([]),
  clearAll: vi.fn().mockResolvedValue(undefined),
  addBottle: vi.fn().mockResolvedValue('id'),
  clearSyncQueue: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../lib/sync-manager', () => ({
  cancelRetries: vi.fn(),
}));

import { loadSettings, setLastSyncedCommitSha } from '../lib/github-settings';
import { pushToGitHub, pullFromGitHub } from '../lib/github-sync';
import { cancelRetries } from '../lib/sync-manager';
import { clearSyncQueue } from '../lib/storage';

const mockedLoadSettings = vi.mocked(loadSettings);
const mockedPush = vi.mocked(pushToGitHub);
const mockedPull = vi.mocked(pullFromGitHub);
const mockedCancelRetries = vi.mocked(cancelRetries);
const mockedClearSyncQueue = vi.mocked(clearSyncQueue);
const mockedSetLastSyncedSha = vi.mocked(setLastSyncedCommitSha);

describe('SyncSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedLoadSettings.mockReturnValue({ repo: 'owner/repo', pat: 'ghp_test' });
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render push and pull buttons', () => {
      render(SyncSection);

      expect(screen.getByTestId('push-button')).toBeInTheDocument();
      expect(screen.getByTestId('pull-button')).toBeInTheDocument();
    });

    it('should render the Data Sync heading', () => {
      render(SyncSection);

      expect(screen.getByText('Data Sync')).toBeInTheDocument();
    });
  });

  describe('push', () => {
    it('should show success message after successful push', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Pushed 3 changes to GitHub.' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(screen.getByTestId('sync-success')).toHaveTextContent('Pushed 3 changes to GitHub.');
    });

    it('should show error message after failed push', async () => {
      mockedPush.mockResolvedValue({ status: 'error', message: 'Push failed: Network error' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(screen.getByTestId('sync-error')).toHaveTextContent('Push failed: Network error');
    });

    it('should clear sync queue and cancel retries on successful push', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(mockedCancelRetries).toHaveBeenCalled();
      expect(mockedClearSyncQueue).toHaveBeenCalled();
    });

    it('should dispatch sync-status-changed events during push', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].detail.status).toBe('syncing');
      expect(handler.mock.calls[1][0].detail.status).toBe('connected');
      window.removeEventListener('sync-status-changed', handler);
    });
  });

  describe('pull', () => {
    it('should show success message after successful pull', async () => {
      mockedPull.mockResolvedValue({
        status: 'success',
        message: 'Pulled 5 bottles from GitHub.',
        bottles: [],
      });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      expect(screen.getByTestId('sync-success')).toHaveTextContent(
        'Pulled 5 bottles from GitHub.',
      );
    });

    it('should show error message after failed pull', async () => {
      mockedPull.mockResolvedValue({ status: 'error', message: 'Pull failed: API error' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      expect(screen.getByTestId('sync-error')).toHaveTextContent('Pull failed: API error');
    });

    it('should clear sync queue and cancel retries on successful pull', async () => {
      mockedPull.mockResolvedValue({ status: 'success', message: 'Done', bottles: [{ id: '1', name: 'W', vintage: 2020, type: 'red', country: 'FR', grapeVariety: [], history: [] }] });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      expect(mockedCancelRetries).toHaveBeenCalled();
      expect(mockedClearSyncQueue).toHaveBeenCalled();
    });

    it('should dispatch offline status on failed pull', async () => {
      mockedPull.mockResolvedValue({ status: 'error', message: 'Pull failed: API error' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('offline');
      window.removeEventListener('sync-status-changed', handler);
    });
  });

  describe('loading states', () => {
    it('should show syncing text on buttons while syncing', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedPush.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );
      render(SyncSection);
      const user = userEvent.setup();

      // Buttons show normal text before clicking
      expect(screen.getByTestId('push-button')).toHaveTextContent('Push');
      expect(screen.getByTestId('pull-button')).toHaveTextContent('Pull');

      // Click push — will hang until we resolve
      const pushPromise = user.click(screen.getByTestId('push-button'));

      // Wait for Svelte to update the DOM
      await vi.waitFor(() => {
        expect(screen.getByTestId('push-button')).toHaveTextContent('Syncing...');
      });
      expect(screen.getByTestId('push-button')).toBeDisabled();
      expect(screen.getByTestId('pull-button')).toBeDisabled();

      resolvePromise!({ status: 'success', message: 'Done' });
      await pushPromise;
    });
  });

  describe('commit SHA persistence', () => {
    it('should store commit SHA after successful push', async () => {
      mockedPush.mockResolvedValue({
        status: 'success',
        message: 'Pushed 1 change',
        commitSha: 'push-sha-123',
      });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(mockedSetLastSyncedSha).toHaveBeenCalledWith('push-sha-123');
    });

    it('should store commit SHA after successful pull', async () => {
      mockedPull.mockResolvedValue({
        status: 'success',
        message: 'Pulled 2 bottles',
        bottles: [{ id: '1', name: 'W', vintage: 2020, type: 'red', country: 'FR', grapeVariety: [], history: [] }],
        commitSha: 'pull-sha-456',
      });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      expect(mockedSetLastSyncedSha).toHaveBeenCalledWith('pull-sha-456');
    });

    it('should dispatch conflict status when push detects conflict', async () => {
      mockedPush.mockResolvedValue({
        status: 'conflict',
        message: 'Remote has changed',
      });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('conflict');
      window.removeEventListener('sync-status-changed', handler);
    });
  });
});
