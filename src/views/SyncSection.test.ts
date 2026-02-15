import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import SyncSection from './SyncSection.svelte';

vi.mock('../lib/github-settings', () => ({
  loadSettings: vi.fn(),
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
}));

import { loadSettings } from '../lib/github-settings';
import { pushToGitHub, pullFromGitHub } from '../lib/github-sync';

const mockedLoadSettings = vi.mocked(loadSettings);
const mockedPush = vi.mocked(pushToGitHub);
const mockedPull = vi.mocked(pullFromGitHub);

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

    it('should dispatch sync-status-changed events during push', async () => {
      mockedPush.mockResolvedValue({ status: 'success', message: 'Done' });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('push-button'));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].detail.status).toBe('syncing');
      expect(handler.mock.calls[1][0].detail.status).toBe('done');
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

    it('should dispatch sync-status-changed events during pull', async () => {
      mockedPull.mockResolvedValue({ status: 'success', message: 'Done', bottles: [] });
      const handler = vi.fn();
      window.addEventListener('sync-status-changed', handler);
      render(SyncSection);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('pull-button'));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler.mock.calls[0][0].detail.status).toBe('syncing');
      expect(handler.mock.calls[1][0].detail.status).toBe('done');
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
});
