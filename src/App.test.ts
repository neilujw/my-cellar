import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

vi.mock('./lib/sync-manager', () => ({
  manualPush: vi.fn(),
  manualPull: vi.fn(),
  cancelRetries: vi.fn(),
}));

vi.mock('./lib/github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
}));

vi.mock('./lib/github-sync', () => ({
  createConflictPR: vi.fn(),
  resolveConflictWithRemote: vi.fn(),
}));

vi.mock('./lib/github-settings', async () => {
  const actual = await vi.importActual('./lib/github-settings');
  return { ...actual, setLastSyncedCommitSha: vi.fn() };
});

import App from './App.svelte';
import { resetDbConnection, clearAll, clearSyncQueue, addToSyncQueue } from './lib/storage';

describe('App', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    window.location.hash = '';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    localStorage.clear();
    resetDbConnection();
    await clearAll();
    await clearSyncQueue();
  });

  afterEach(() => {
    cleanup();
  });

  describe('layout', () => {
    it('should render the app title in the header', () => {
      render(App);

      expect(screen.getByText('My Cellar')).toBeInTheDocument();
    });

    it('should render 4 tabs in the bottom tab bar', () => {
      render(App);

      expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('tab-add')).toBeInTheDocument();
      expect(screen.getByTestId('tab-search')).toBeInTheDocument();
      expect(screen.getByTestId('tab-settings')).toBeInTheDocument();
    });
  });

  describe('routing', () => {
    it('should render Dashboard view by default', async () => {
      render(App);

      expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    it('should render Add Bottle view when hash is #/add', () => {
      window.location.hash = '#/add';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      render(App);

      expect(screen.getByRole('heading', { name: 'Add Bottle' })).toBeInTheDocument();
    });

    it('should render Search view when hash is #/search', async () => {
      window.location.hash = '#/search';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      render(App);

      expect(await screen.findByRole('heading', { name: 'Search' })).toBeInTheDocument();
    });

    it('should render Settings view when hash is #/settings', () => {
      window.location.hash = '#/settings';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      render(App);

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should navigate to a view when clicking a tab', async () => {
      render(App);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('tab-settings'));
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('startup behavior', () => {
    it('should not trigger any automatic push on startup', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test' });

      render(App);

      // Give time for any async effects to run
      await new Promise((resolve) => setTimeout(resolve, 50));

      // No automatic push should happen
      const { manualPush } = await import('./lib/sync-manager');
      expect(manualPush).not.toHaveBeenCalled();
    });

    it('should not render sync button when GitHub is not configured', () => {
      render(App);

      expect(screen.queryByTestId('sync-button')).not.toBeInTheDocument();
    });

    it('should render sync button when GitHub is configured', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );

      render(App);

      await waitFor(() => {
        expect(screen.getByTestId('sync-button')).toBeInTheDocument();
      });
    });

    it('should show pending count badge when queue has items on startup', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test1' });
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test2' });
      await addToSyncQueue({ timestamp: '2026-01-01T00:00:00Z', action: 'test3' });

      render(App);

      await waitFor(() => {
        expect(screen.getByTestId('sync-badge')).toHaveTextContent('3');
      });
    });
  });

  describe('sync status via events', () => {
    it('should update sync button when sync-status-changed event is dispatched', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', { detail: { status: 'syncing', pendingCount: 0 } }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-button')).toHaveTextContent('Syncing...');
      });
    });

    it('should show pending count after mutation events', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', { detail: { status: 'connected', pendingCount: 2 } }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-badge')).toHaveTextContent('2');
      });
    });
  });

  describe('conflict modal', () => {
    it('should show conflict modal when sync status is conflict', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', {
          detail: { status: 'conflict', pendingCount: 0 },
        }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('conflict-modal')).toBeInTheDocument();
      });
    });

    it('should hide conflict modal when conflict-resolved event is dispatched', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', {
          detail: { status: 'conflict', pendingCount: 0 },
        }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('conflict-modal')).toBeInTheDocument();
      });

      window.dispatchEvent(new CustomEvent('conflict-resolved'));

      await waitFor(() => {
        expect(screen.queryByTestId('conflict-modal')).not.toBeInTheDocument();
      });
    });
  });
});
