import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import App from './App.svelte';
import { resetDbConnection, clearAll } from './lib/storage';

describe('App', () => {
  beforeEach(async () => {
    window.location.hash = '';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    localStorage.clear();
    resetDbConnection();
    await clearAll();
  });

  afterEach(() => {
    cleanup();
  });

  describe('layout', () => {
    it('should render the app title in the header', () => {
      render(App);

      expect(screen.getByText('My Cellar')).toBeInTheDocument();
    });

    it('should render the sync status indicator', () => {
      render(App);

      expect(screen.getByTestId('sync-status')).toBeInTheDocument();
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

  describe('sync status', () => {
    it('should show "Not configured" when no settings exist', () => {
      render(App);

      expect(screen.getByTestId('sync-status')).toHaveTextContent('Not configured');
    });

    it('should show "Connected" when settings are saved', () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );

      render(App);

      expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected');
    });

    it('should update status when settings-changed event is dispatched', async () => {
      render(App);
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Not configured');

      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      window.dispatchEvent(new CustomEvent('settings-changed'));

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected');
      });
    });

    it('should revert to "Not configured" after disconnect', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected');

      localStorage.removeItem('my-cellar-github-settings');
      window.dispatchEvent(new CustomEvent('settings-changed'));

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Not configured');
      });
    });

    it('should show "Syncing..." when sync-status-changed event is dispatched with syncing', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);
      expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected');

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', { detail: { status: 'syncing' } }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Syncing...');
      });
    });

    it('should revert to "Connected" when sync completes', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'owner/repo', pat: 'ghp_test' }),
      );
      render(App);

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', { detail: { status: 'syncing' } }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Syncing...');
      });

      window.dispatchEvent(
        new CustomEvent('sync-status-changed', { detail: { status: 'done' } }),
      );

      await waitFor(() => {
        expect(screen.getByTestId('sync-status')).toHaveTextContent('Connected');
      });
    });
  });
});
