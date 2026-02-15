import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import Settings from './Settings.svelte';

vi.mock('../lib/github-client', () => ({
  createGitHubClient: vi.fn(() => ({})),
  testConnection: vi.fn(),
}));

import { testConnection } from '../lib/github-client';

const mockedTestConnection = vi.mocked(testConnection);

describe('Settings', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('form rendering', () => {
    it('should render the settings heading', () => {
      render(Settings);

      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });

    it('should render repository and PAT input fields', () => {
      render(Settings);

      expect(screen.getByTestId('input-repo')).toBeInTheDocument();
      expect(screen.getByTestId('input-pat')).toBeInTheDocument();
    });

    it('should render PAT as a password field', () => {
      render(Settings);

      expect(screen.getByTestId('input-pat')).toHaveAttribute('type', 'password');
    });

    it('should render Test Connection and Save buttons', () => {
      render(Settings);

      expect(screen.getByTestId('test-connection')).toBeInTheDocument();
      expect(screen.getByTestId('save-settings')).toBeInTheDocument();
    });

    it('should disable Save button initially', () => {
      render(Settings);

      expect(screen.getByTestId('save-settings')).toBeDisabled();
    });
  });

  describe('validation', () => {
    it('should show error when repository is empty', async () => {
      render(Settings);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('error-repo')).toHaveTextContent('Repository is required.');
    });

    it('should show error when repository format is invalid', async () => {
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'invalidformat');
      await user.type(screen.getByTestId('input-pat'), 'ghp_test');
      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('error-repo')).toHaveTextContent('owner/repo');
    });

    it('should show error when PAT is empty', async () => {
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('error-pat')).toHaveTextContent(
        'Personal Access Token is required.',
      );
    });
  });

  describe('connection testing', () => {
    it('should show success message after successful connection test', async () => {
      mockedTestConnection.mockResolvedValue({ status: 'connected' });
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.type(screen.getByTestId('input-pat'), 'ghp_test');
      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('connection-success')).toBeInTheDocument();
    });

    it('should show error message after failed connection test', async () => {
      mockedTestConnection.mockResolvedValue({
        status: 'error',
        message: 'Invalid Personal Access Token.',
      });
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.type(screen.getByTestId('input-pat'), 'ghp_bad');
      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('connection-error')).toHaveTextContent(
        'Invalid Personal Access Token.',
      );
    });

    it('should enable Save button after successful connection test', async () => {
      mockedTestConnection.mockResolvedValue({ status: 'connected' });
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.type(screen.getByTestId('input-pat'), 'ghp_test');
      await user.click(screen.getByTestId('test-connection'));

      expect(screen.getByTestId('save-settings')).not.toBeDisabled();
    });
  });

  describe('save and load', () => {
    it('should persist settings to localStorage when Save is clicked', async () => {
      mockedTestConnection.mockResolvedValue({ status: 'connected' });
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.type(screen.getByTestId('input-pat'), 'ghp_test');
      await user.click(screen.getByTestId('test-connection'));
      await user.click(screen.getByTestId('save-settings'));

      const stored = JSON.parse(localStorage.getItem('my-cellar-github-settings')!);
      expect(stored).toEqual({ repo: 'owner/repo', pat: 'ghp_test' });
    });

    it('should pre-fill form from localStorage on mount', () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'saved/repo', pat: 'ghp_saved' }),
      );

      render(Settings);

      expect(screen.getByTestId('input-repo')).toHaveValue('saved/repo');
      expect(screen.getByTestId('input-pat')).toHaveValue('ghp_saved');
    });

    it('should show Disconnect button when settings are saved', async () => {
      mockedTestConnection.mockResolvedValue({ status: 'connected' });
      render(Settings);
      const user = userEvent.setup();

      await user.type(screen.getByTestId('input-repo'), 'owner/repo');
      await user.type(screen.getByTestId('input-pat'), 'ghp_test');
      await user.click(screen.getByTestId('test-connection'));
      await user.click(screen.getByTestId('save-settings'));

      expect(screen.getByTestId('disconnect')).toBeInTheDocument();
    });
  });

  describe('disconnect', () => {
    it('should clear settings and reset form when Disconnect is clicked', async () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 'saved/repo', pat: 'ghp_saved' }),
      );
      render(Settings);
      const user = userEvent.setup();

      await user.click(screen.getByTestId('disconnect'));

      expect(screen.getByTestId('input-repo')).toHaveValue('');
      expect(screen.getByTestId('input-pat')).toHaveValue('');
      expect(localStorage.getItem('my-cellar-github-settings')).toBeNull();
      expect(screen.queryByTestId('disconnect')).not.toBeInTheDocument();
    });
  });
});
