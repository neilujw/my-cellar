import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import ConflictModal from './ConflictModal.svelte';

vi.mock('../lib/github-settings', () => ({
  setLastSyncedCommitSha: vi.fn(),
}));

vi.mock('../lib/github-sync', () => ({
  createConflictPR: vi.fn(),
  resolveConflictWithRemote: vi.fn(),
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

import { createConflictPR, resolveConflictWithRemote } from '../lib/github-sync';
import { setLastSyncedCommitSha } from '../lib/github-settings';
import { clearAll, clearSyncQueue } from '../lib/storage';
import { cancelRetries } from '../lib/sync-manager';

const mockedCreatePR = vi.mocked(createConflictPR);
const mockedResolveWithRemote = vi.mocked(resolveConflictWithRemote);
const mockedSetSha = vi.mocked(setLastSyncedCommitSha);
const mockedClearAll = vi.mocked(clearAll);
const mockedClearSyncQueue = vi.mocked(clearSyncQueue);
const mockedCancelRetries = vi.mocked(cancelRetries);

/** Creates a minimal mock Octokit client. */
function createMockClient(): unknown {
  return {};
}

describe('ConflictModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('rendering', () => {
    it('should render the conflict modal with title and description', () => {
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });

      expect(screen.getByText('Sync Conflict Detected')).toBeInTheDocument();
      expect(
        screen.getByText(/The remote repository has changed since your last sync/),
      ).toBeInTheDocument();
    });

    it('should render both resolution buttons', () => {
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });

      expect(screen.getByTestId('create-pr-button')).toHaveTextContent('Create Pull Request');
      expect(screen.getByTestId('overwrite-local-button')).toHaveTextContent('Use Remote Data');
    });
  });

  describe('Create Pull Request', () => {
    it('should call createConflictPR and show success message', async () => {
      mockedCreatePR.mockResolvedValue({
        status: 'success',
        message: 'Pull request created: https://github.com/owner/repo/pull/1',
      });
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('create-pr-button'));

      expect(screen.getByTestId('conflict-success')).toHaveTextContent('Pull request created:');
    });

    it('should show error message when PR creation fails', async () => {
      mockedCreatePR.mockResolvedValue({
        status: 'error',
        message: 'PR creation failed: Network error',
      });
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('create-pr-button'));

      expect(screen.getByTestId('conflict-error')).toHaveTextContent('PR creation failed');
    });

    it('should dispatch conflict-resolved event on success', async () => {
      mockedCreatePR.mockResolvedValue({ status: 'success', message: 'PR created' });
      const handler = vi.fn();
      window.addEventListener('conflict-resolved', handler);
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('create-pr-button'));

      expect(handler).toHaveBeenCalled();
      window.removeEventListener('conflict-resolved', handler);
    });

    it('should dispatch connected sync status on success', async () => {
      mockedCreatePR.mockResolvedValue({ status: 'success', message: 'PR created' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('create-pr-button'));

      const lastCall = handler.mock.calls[handler.mock.calls.length - 1][0].detail;
      expect(lastCall.status).toBe('connected');
      window.removeEventListener('sync-status-changed', handler);
    });
  });

  describe('Use Remote Data', () => {
    it('should pull remote data and replace local storage', async () => {
      mockedResolveWithRemote.mockResolvedValue({
        status: 'success',
        message: 'Pulled 3 bottles',
        bottles: [
          {
            id: 'b1',
            name: 'Wine A',
            vintage: 2020,
            type: 'red' as never,
            country: 'France',
            region: 'Bordeaux',
            grapeVariety: [],
            history: [],
          },
        ],
        commitSha: 'remote-sha-123',
      });
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('overwrite-local-button'));

      expect(mockedClearAll).toHaveBeenCalled();
      expect(mockedCancelRetries).toHaveBeenCalled();
      expect(mockedClearSyncQueue).toHaveBeenCalled();
      expect(mockedSetSha).toHaveBeenCalledWith('remote-sha-123');
    });

    it('should dispatch conflict-resolved event on success', async () => {
      mockedResolveWithRemote.mockResolvedValue({
        status: 'success',
        message: 'Pulled',
        bottles: [],
        commitSha: 'sha',
      });
      const handler = vi.fn();
      window.addEventListener('conflict-resolved', handler);
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('overwrite-local-button'));

      expect(handler).toHaveBeenCalled();
      window.removeEventListener('conflict-resolved', handler);
    });

    it('should show error when pull fails', async () => {
      mockedResolveWithRemote.mockResolvedValue({
        status: 'error',
        message: 'Pull failed: Network error',
      });
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('overwrite-local-button'));

      expect(screen.getByTestId('conflict-error')).toHaveTextContent('Pull failed');
    });
  });

  describe('loading states', () => {
    it('should show loading state on buttons while processing', async () => {
      let resolvePromise: (value: unknown) => void;
      mockedCreatePR.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );
      render(ConflictModal, { props: { client: createMockClient(), repo: 'owner/repo' } });
      const user = userEvent.setup();

      const clickPromise = user.click(screen.getByTestId('create-pr-button'));

      await vi.waitFor(() => {
        expect(screen.getByTestId('create-pr-button')).toHaveTextContent('Processing...');
      });
      expect(screen.getByTestId('create-pr-button')).toBeDisabled();
      expect(screen.getByTestId('overwrite-local-button')).toBeDisabled();

      resolvePromise!({ status: 'success', message: 'Done' });
      await clickPromise;
    });
  });
});
