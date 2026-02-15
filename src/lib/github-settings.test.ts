import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveSettings,
  loadSettings,
  clearSettings,
  getLastSyncedCommitSha,
  setLastSyncedCommitSha,
  clearLastSyncedCommitSha,
} from './github-settings';
import type { GitHubSettings } from './types';

describe('github-settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const validSettings: GitHubSettings = {
    repo: 'owner/repo',
    pat: 'ghp_abc123',
  };

  describe('saveSettings', () => {
    it('should persist settings to localStorage', () => {
      saveSettings(validSettings);

      const stored = localStorage.getItem('my-cellar-github-settings');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(validSettings);
    });

    it('should overwrite previously saved settings', () => {
      saveSettings(validSettings);
      const updated: GitHubSettings = { repo: 'other/repo', pat: 'ghp_xyz789' };

      saveSettings(updated);

      expect(loadSettings()).toEqual(updated);
    });
  });

  describe('loadSettings', () => {
    it('should return null when no settings are stored', () => {
      expect(loadSettings()).toBeNull();
    });

    it('should return saved settings', () => {
      saveSettings(validSettings);

      expect(loadSettings()).toEqual(validSettings);
    });

    it('should return null when stored data is invalid JSON', () => {
      localStorage.setItem('my-cellar-github-settings', 'not-json{');

      expect(() => loadSettings()).toThrow();
    });

    it('should return null when stored data is missing repo', () => {
      localStorage.setItem('my-cellar-github-settings', JSON.stringify({ pat: 'ghp_abc' }));

      expect(loadSettings()).toBeNull();
    });

    it('should return null when stored data is missing pat', () => {
      localStorage.setItem('my-cellar-github-settings', JSON.stringify({ repo: 'owner/repo' }));

      expect(loadSettings()).toBeNull();
    });

    it('should return null when stored data has wrong types', () => {
      localStorage.setItem(
        'my-cellar-github-settings',
        JSON.stringify({ repo: 123, pat: true }),
      );

      expect(loadSettings()).toBeNull();
    });
  });

  describe('clearSettings', () => {
    it('should remove settings from localStorage', () => {
      saveSettings(validSettings);

      clearSettings();

      expect(loadSettings()).toBeNull();
    });

    it('should not throw when no settings exist', () => {
      expect(() => clearSettings()).not.toThrow();
    });

    it('should also clear last synced commit SHA', () => {
      setLastSyncedCommitSha('abc123');

      clearSettings();

      expect(getLastSyncedCommitSha()).toBeNull();
    });
  });

  describe('last synced commit SHA', () => {
    it('should return null when no SHA is stored', () => {
      expect(getLastSyncedCommitSha()).toBeNull();
    });

    it('should store and retrieve a commit SHA', () => {
      setLastSyncedCommitSha('abc123def456');

      expect(getLastSyncedCommitSha()).toBe('abc123def456');
    });

    it('should overwrite a previously stored SHA', () => {
      setLastSyncedCommitSha('first-sha');

      setLastSyncedCommitSha('second-sha');

      expect(getLastSyncedCommitSha()).toBe('second-sha');
    });

    it('should clear a stored SHA', () => {
      setLastSyncedCommitSha('abc123');

      clearLastSyncedCommitSha();

      expect(getLastSyncedCommitSha()).toBeNull();
    });

    it('should not throw when clearing a non-existent SHA', () => {
      expect(() => clearLastSyncedCommitSha()).not.toThrow();
    });
  });
});
