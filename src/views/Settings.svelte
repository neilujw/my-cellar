<script lang="ts">
  /**
   * Settings view — configure GitHub repository connection and PAT authentication.
   * Allows testing the connection, saving credentials, and disconnecting.
   */
  import type { ConnectionStatus } from '../lib/types';
  import { saveSettings, loadSettings, clearSettings, getLastSyncedCommitSha } from '../lib/github-settings';
  import { validateRepo, validatePat } from '../lib/settings-utils';
  import { createGitHubClient, testConnection } from '../lib/github-client';
  import SyncSection from './SyncSection.svelte';
  import { toastSuccess, toastError, toastInfo } from '../lib/toast.svelte';

  let repo = $state('');
  let pat = $state('');
  let repoError = $state<string | null>(null);
  let patError = $state<string | null>(null);
  let testing = $state(false);
  let connectionResult = $state<ConnectionStatus | null>(null);
  let saved = $state(false);

  // Pre-fill form from localStorage on mount
  const existing = loadSettings();
  if (existing) {
    repo = existing.repo;
    pat = existing.pat;
    saved = true;
  }

  function validate(): boolean {
    repoError = validateRepo(repo);
    patError = validatePat(pat);
    return !repoError && !patError;
  }

  async function handleTestConnection(): Promise<void> {
    if (!validate()) return;

    testing = true;
    connectionResult = null;

    const client = createGitHubClient(pat.trim());
    connectionResult = await testConnection(client, repo.trim());
    testing = false;

    if (connectionResult.status === 'connected') {
      toastSuccess('Connection successful');
    } else if (connectionResult.status === 'error') {
      toastError(connectionResult.message);
    }
  }

  function handleSave(): void {
    saveSettings({ repo: repo.trim(), pat: pat.trim() });
    saved = true;
    window.dispatchEvent(new CustomEvent('settings-changed'));
  }

  function handleDisconnect(): void {
    clearSettings();
    repo = '';
    pat = '';
    repoError = null;
    patError = null;
    connectionResult = null;
    saved = false;
    window.dispatchEvent(new CustomEvent('settings-changed'));
    toastInfo('Disconnected from GitHub');
  }
</script>

<div class="p-4">
  <h2 class="text-2xl font-bold">Settings</h2>
  <p class="mt-1 text-sm text-gray-600">Connect to your private GitHub repository for data sync.</p>

  <form class="mt-6 space-y-4" onsubmit={(e) => e.preventDefault()}>
    <div>
      <label for="repo" class="block text-sm font-medium text-gray-700">Repository</label>
      <input
        id="repo"
        type="text"
        placeholder="owner/repo"
        class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        value={repo}
        oninput={(e) => { repo = e.currentTarget.value; repoError = null; }}
        data-testid="input-repo"
      />
      {#if repoError}
        <p class="mt-1 text-sm text-red-600" data-testid="error-repo">{repoError}</p>
      {/if}
    </div>

    <div>
      <label for="pat" class="block text-sm font-medium text-gray-700">Personal Access Token</label>
      <input
        id="pat"
        type="password"
        placeholder="ghp_..."
        class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
        value={pat}
        oninput={(e) => { pat = e.currentTarget.value; patError = null; }}
        data-testid="input-pat"
      />
      {#if patError}
        <p class="mt-1 text-sm text-red-600" data-testid="error-pat">{patError}</p>
      {/if}
    </div>

    {#if connectionResult}
      {#if connectionResult.status === 'connected'}
        <div class="rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800" data-testid="connection-success">
          Connection successful! Repository is accessible with read/write permissions.
        </div>
      {:else if connectionResult.status === 'error'}
        <div class="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="connection-error">
          {connectionResult.message}
        </div>
      {/if}
    {/if}

    <div class="flex gap-3">
      <button
        type="button"
        class="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        onclick={handleTestConnection}
        disabled={testing}
        data-testid="test-connection"
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </button>

      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        onclick={handleSave}
        disabled={connectionResult?.status !== 'connected'}
        data-testid="save-settings"
      >
        Save
      </button>
    </div>

    {#if saved}
      <div class="border-t border-gray-200 pt-4">
        <button
          type="button"
          class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          onclick={handleDisconnect}
          data-testid="disconnect"
        >
          Disconnect
        </button>
      </div>

      <SyncSection />
    {/if}
  </form>

  <div class="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-400" data-testid="app-info">
    <p>Version {__APP_VERSION__}{#if saved}{@const sha = getLastSyncedCommitSha()}{#if sha} &middot; Last sync: <span data-testid="last-sync-sha">{sha.slice(0, 7)}</span>{/if}{/if}</p>
  </div>
</div>
