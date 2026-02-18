import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import SyncButton from './SyncButton.svelte';

vi.mock('../lib/sync-manager', () => ({
  manualPush: vi.fn().mockResolvedValue(undefined),
  manualPull: vi.fn().mockResolvedValue(undefined),
}));

import { manualPush, manualPull } from '../lib/sync-manager';

const mockedManualPush = vi.mocked(manualPush);
const mockedManualPull = vi.mocked(manualPull);

describe('SyncButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('visibility', () => {
    it('should not render when syncStatus is not-configured', () => {
      render(SyncButton, { props: { syncStatus: 'not-configured', pendingCount: 0 } });

      expect(screen.queryByTestId('sync-button')).not.toBeInTheDocument();
    });

    it('should render when syncStatus is connected', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toBeInTheDocument();
    });
  });

  describe('badge', () => {
    it('should show badge with pending count when pendingCount > 0', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 5 } });

      const badge = screen.getByTestId('sync-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('5');
    });

    it('should not show badge when pendingCount is 0', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 0 } });

      expect(screen.queryByTestId('sync-badge')).not.toBeInTheDocument();
    });
  });

  describe('label text', () => {
    it('should show pending count when pendingCount > 0', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 3 } });

      expect(screen.getByTestId('sync-button')).toHaveTextContent('3 pending');
    });

    it('should show "Synced" when connected and no pending changes', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toHaveTextContent('Synced');
    });

    it('should show "Syncing..." when syncing', () => {
      render(SyncButton, { props: { syncStatus: 'syncing', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toHaveTextContent('Syncing...');
    });

    it('should show "Error" when error', () => {
      render(SyncButton, { props: { syncStatus: 'error', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toHaveTextContent('Error');
    });

    it('should show "Conflict" when conflict', () => {
      render(SyncButton, { props: { syncStatus: 'conflict', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toHaveTextContent('Conflict');
    });
  });

  describe('disabled state', () => {
    it('should be disabled while syncing', () => {
      render(SyncButton, { props: { syncStatus: 'syncing', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toBeDisabled();
    });

    it('should be disabled during conflict', () => {
      render(SyncButton, { props: { syncStatus: 'conflict', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).toBeDisabled();
    });

    it('should not be disabled when connected', () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 0 } });

      expect(screen.getByTestId('sync-button')).not.toBeDisabled();
    });
  });

  describe('click behavior', () => {
    it('should call manualPush when pendingCount > 0', async () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 3 } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('sync-button'));

      expect(mockedManualPush).toHaveBeenCalledOnce();
      expect(mockedManualPull).not.toHaveBeenCalled();
    });

    it('should call manualPull when pendingCount is 0', async () => {
      render(SyncButton, { props: { syncStatus: 'connected', pendingCount: 0 } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('sync-button'));

      expect(mockedManualPull).toHaveBeenCalledOnce();
      expect(mockedManualPush).not.toHaveBeenCalled();
    });

    it('should not call anything when disabled (syncing)', async () => {
      render(SyncButton, { props: { syncStatus: 'syncing', pendingCount: 0 } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('sync-button'));

      expect(mockedManualPush).not.toHaveBeenCalled();
      expect(mockedManualPull).not.toHaveBeenCalled();
    });

    it('should call manualPush when error status and pendingCount > 0', async () => {
      render(SyncButton, { props: { syncStatus: 'error', pendingCount: 2 } });
      const user = userEvent.setup();

      await user.click(screen.getByTestId('sync-button'));

      expect(mockedManualPush).toHaveBeenCalledOnce();
    });
  });
});
