<script lang="ts">
  /**
   * Data Sync section — Push and Pull buttons for manual GitHub synchronization.
   * Displays loading states and success/error feedback messages.
   */
  import type { SyncResult } from '../lib/types';
  import { createGitHubClient } from '../lib/github-client';
  import { loadSettings } from '../lib/github-settings';
  import { pushToGitHub, pullFromGitHub } from '../lib/github-sync';
  import { getAllBottles, clearAll, addBottle } from '../lib/storage';

  let syncing = $state(false);
  let result = $state<SyncResult | null>(null);

  /** Dispatches sync-status-changed event to update header indicator. */
  function dispatchSyncStatus(status: 'syncing' | 'done'): void {
    window.dispatchEvent(new CustomEvent('sync-status-changed', { detail: { status } }));
  }

  /** Pushes all local bottles to GitHub. */
  async function handlePush(): Promise<void> {
    const settings = loadSettings();
    if (!settings) return;

    syncing = true;
    result = null;
    dispatchSyncStatus('syncing');

    const client = createGitHubClient(settings.pat);
    const bottles = await getAllBottles();
    result = await pushToGitHub(client, settings.repo, bottles);

    syncing = false;
    dispatchSyncStatus('done');
  }

  /** Pulls all bottles from GitHub, replacing local data. */
  async function handlePull(): Promise<void> {
    const settings = loadSettings();
    if (!settings) return;

    syncing = true;
    result = null;
    dispatchSyncStatus('syncing');

    const client = createGitHubClient(settings.pat);
    const pullResult = await pullFromGitHub(client, settings.repo);

    if (pullResult.status === 'success' && pullResult.bottles) {
      await clearAll();
      for (const bottle of pullResult.bottles) {
        await addBottle(bottle);
      }
    }

    result = { status: pullResult.status, message: pullResult.message };
    syncing = false;
    dispatchSyncStatus('done');
  }
</script>

<div class="border-t border-gray-200 pt-4" data-testid="sync-section">
  <h3 class="text-lg font-semibold">Data Sync</h3>
  <p class="mt-1 text-sm text-gray-600">Manually sync your cellar with GitHub.</p>

  <div class="mt-3 flex gap-3">
    <button
      type="button"
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      onclick={handlePush}
      disabled={syncing}
      data-testid="push-button"
    >
      {syncing ? 'Syncing...' : 'Push'}
    </button>

    <button
      type="button"
      class="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
      onclick={handlePull}
      disabled={syncing}
      data-testid="pull-button"
    >
      {syncing ? 'Syncing...' : 'Pull'}
    </button>
  </div>

  {#if result}
    {#if result.status === 'success'}
      <div
        class="mt-3 rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
        data-testid="sync-success"
      >
        {result.message}
      </div>
    {:else}
      <div
        class="mt-3 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        data-testid="sync-error"
      >
        {result.message}
      </div>
    {/if}
  {/if}
</div>
