import type { GitHubSettings } from './types';

const STORAGE_KEY = 'my-cellar-github-settings';

/** Persists GitHub settings (repo and PAT) to localStorage. */
export function saveSettings(settings: GitHubSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/** Loads previously saved GitHub settings from localStorage, or null if none exist. */
export function loadSettings(): GitHubSettings | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const parsed: unknown = JSON.parse(raw);
  if (
    typeof parsed === 'object' &&
    parsed !== null &&
    'repo' in parsed &&
    'pat' in parsed &&
    typeof (parsed as GitHubSettings).repo === 'string' &&
    typeof (parsed as GitHubSettings).pat === 'string'
  ) {
    return parsed as GitHubSettings;
  }

  return null;
}

/** Removes stored GitHub settings from localStorage. */
export function clearSettings(): void {
  localStorage.removeItem(STORAGE_KEY);
}
