import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import SyncSection from './SyncSection.svelte';

vi.mock('../lib/github-settings', () => ({
  loadSettings: vi.fn(),
  setLastSyncedCommitSha: vi.fn(),
}));

vi.mock('../lib/github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
}));

vi.mock('../lib/github-sync', () => ({
  createConflictPR: vi.fn(),
  pullFromGitHub: vi.fn(),
}));

vi.mock('../lib/storage', () => ({
  getAllBottles: vi.fn().mockResolvedValue([]),
  clearAll: vi.fn().mockResolvedValue(undefined),
  addBottle: vi.fn().mockResolvedValue('id'),
  clearSyncQueue: vi.fn().mockResolvedValue(undefined),
}));

import { loadSettings, setLastSyncedCommitSha } from '../lib/github-settings';
import { createConflictPR, pullFromGitHub } from '../lib/github-sync';
import { clearSyncQueue } from '../lib/storage';

const mockedLoadSettings = vi.mocked(loadSettings);
const mockedCreateConflictPR = vi.mocked(createConflictPR);
const mockedPull = vi.mocked(pullFromGitHub);
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
    it('should render force push and force pull buttons', () => {
      render(SyncSection);

      expect(screen.getByTestId('force-push-button')).toBeInTheDocument();
      expect(screen.getByTestId('force-pull-button')).toBeInTheDocument();
    });

    it('should render the Force Sync Options heading', () => {
      render(SyncSection);

      expect(screen.getByText('Force Sync Options')).toBeInTheDocument();
    });

    it('should show correct button labels', () => {
      render(SyncSection);

      expect(screen.getByTestId('force-push-button')).toHaveTextContent('Force Push (create PR)');
      expect(screen.getByTestId('force-pull-button')).toHaveTextContent('Force Pull (overwrite local)');
    });
  });

  describe('force push', () => {
    it('should call createConflictPR and show success message', async () => {
      mockedCreateConflictPR.mockResolvedValue({ status: 'success', message: 'Pull request created: https://github.com/owner/repo/pull/1' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-push-button'));

      expect(mockedCreateConflictPR).toHaveBeenCalledOnce();
      expect(screen.getByTestId('sync-success')).toHaveTextContent('Pull request created:');
    });

    it('should show error message after failed force push', async () => {
      mockedCreateConflictPR.mockResolvedValue({ status: 'error', message: 'PR creation failed: Network error' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-push-button'));

      expect(screen.getByTestId('sync-error')).toHaveTextContent('PR creation failed: Network error');
    });

    it('should dispatch sync-status-changed events during force push', async () => {
      mockedCreateConflictPR.mockResolvedValue({ status: 'success', message: 'Done' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-push-button'));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].detail.status).toBe('syncing');
      expect(handler.mock.calls[1][0].detail.status).toBe('connected');
      window.removeEventListener('sync-status-changed', handler);
    });
  });

  describe('force pull', () => {
    it('should show success message after successful force pull', async () => {
      mockedPull.mockResolvedValue({
        status: 'success',
        message: 'Pulled 5 bottles from GitHub.',
        bottles: [],
      });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-pull-button'));

      expect(screen.getByTestId('sync-success')).toHaveTextContent(
        'Pulled 5 bottles from GitHub.',
      );
    });

    it('should show error message after failed force pull', async () => {
      mockedPull.mockResolvedValue({ status: 'error', message: 'Pull failed: API error' });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-pull-button'));

      expect(screen.getByTestId('sync-error')).toHaveTextContent('Pull failed: API error');
    });

    it('should clear sync queue on successful force pull', async () => {
      mockedPull.mockResolvedValue({ status: 'success', message: 'Done', bottles: [{ id: '1', name: 'W', vintage: 2020, type: 'red', country: 'FR', grapeVariety: [], history: [] }] });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-pull-button'));

      expect(mockedClearSyncQueue).toHaveBeenCalled();
    });

    it('should store commit SHA after successful force pull', async () => {
      mockedPull.mockResolvedValue({
        status: 'success',
        message: 'Pulled 2 bottles',
        bottles: [{ id: '1', name: 'W', vintage: 2020, type: 'red', country: 'FR', grapeVariety: [], history: [] }],
        commitSha: 'pull-sha-456',
      });
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('force-pull-button'));

      expect(mockedSetLastSyncedSha).toHaveBeenCalledWith('pull-sha-456');
    });
  });

  describe('loading states', () => {
    it('should show syncing text on buttons while syncing', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedCreateConflictPR.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );
      render(SyncSection);
      const user = userEvent.setup();

      // Buttons show normal text before clicking
      expect(screen.getByTestId('force-push-button')).toHaveTextContent('Force Push (create PR)');
      expect(screen.getByTestId('force-pull-button')).toHaveTextContent('Force Pull (overwrite local)');

      // Click force push — will hang until we resolve
      const pushPromise = user.click(screen.getByTestId('force-push-button'));

      // Wait for Svelte to update the DOM
      await vi.waitFor(() => {
        expect(screen.getByTestId('force-push-button')).toHaveTextContent('Syncing...');
      });
      expect(screen.getByTestId('force-push-button')).toBeDisabled();
      expect(screen.getByTestId('force-pull-button')).toBeDisabled();

      resolvePromise!({ status: 'success', message: 'Done' });
      await pushPromise;
    });
  });
});
