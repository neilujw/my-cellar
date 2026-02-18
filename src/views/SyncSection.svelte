<script lang="ts">
  /**
   * Force sync section — Force Push (create PR) and Force Pull (overwrite local) actions.
   * Used when normal push/pull via the header SyncButton is insufficient.
   */
  import type { SyncResult, SyncStatus } from '../lib/types';
  import { createGitHubClient } from '../lib/github-client';
  import { loadSettings, setLastSyncedCommitSha } from '../lib/github-settings';
  import { createConflictPR, pullFromGitHub } from '../lib/github-sync';
  import { getAllBottles, clearAll, addBottle, clearSyncQueue } from '../lib/storage';
  import { toastSuccess, toastError } from '../lib/toast.svelte';

  let syncing = $state(false);
  let result = $state<SyncResult | null>(null);

  /** Dispatches sync-status-changed event to update header indicator. */
  function dispatchSyncStatus(status: SyncStatus, pendingCount: number = 0): void {
    window.dispatchEvent(
      new CustomEvent('sync-status-changed', { detail: { status, pendingCount } }),
    );
  }

  /** Creates a PR with local changes on a conflict branch (force push). */
  async function handleForcePush(): Promise<void> {
    const settings = loadSettings();
    if (!settings) return;

    syncing = true;
    result = null;
    dispatchSyncStatus('syncing');

    try {
      const client = createGitHubClient(settings.pat);
      const bottles = await getAllBottles();
      const prResult = await createConflictPR(client, settings.repo, bottles);

      if (prResult.status === 'success') {
        dispatchSyncStatus('connected');
        toastSuccess('Pull request created successfully');
      } else {
        dispatchSyncStatus('error');
        toastError(prResult.message);
      }

      result = prResult;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Force push failed unexpectedly';
      result = { status: 'error', message };
      dispatchSyncStatus('error');
      toastError(message);
    } finally {
      syncing = false;
    }
  }

  /** Pulls all bottles from GitHub, replacing local data (force pull). */
  async function handleForcePull(): Promise<void> {
    const settings = loadSettings();
    if (!settings) return;

    syncing = true;
    result = null;
    dispatchSyncStatus('syncing');

    try {
      const client = createGitHubClient(settings.pat);
      const pullResult = await pullFromGitHub(client, settings.repo);

      if (pullResult.bottles && pullResult.bottles.length > 0) {
        await clearAll();
        for (const bottle of pullResult.bottles) {
          await addBottle(bottle);
        }
        if (pullResult.commitSha) {
          setLastSyncedCommitSha(pullResult.commitSha);
        }
        await clearSyncQueue();
      }

      if (pullResult.status === 'success') {
        dispatchSyncStatus('connected');
        toastSuccess('Force pull completed successfully');
      } else {
        dispatchSyncStatus(pullResult.bottles?.length ? 'connected' : 'error');
        toastError(pullResult.message);
      }

      result = { status: pullResult.status, message: pullResult.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Force pull failed unexpectedly';
      result = { status: 'error', message };
      dispatchSyncStatus('error');
      toastError(message);
    } finally {
      syncing = false;
    }
  }
</script>

<div class="border-t border-gray-200 pt-4" data-testid="sync-section">
  <h3 class="text-lg font-semibold">Force Sync Options</h3>
  <p class="mt-1 text-sm text-gray-600">Use these options to force-sync your cellar with GitHub.</p>

  <div class="mt-3 flex gap-3">
    <button
      type="button"
      class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      onclick={handleForcePush}
      disabled={syncing}
      data-testid="force-push-button"
    >
      {syncing ? 'Syncing...' : 'Force Push (create PR)'}
    </button>

    <button
      type="button"
      class="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
      onclick={handleForcePull}
      disabled={syncing}
      data-testid="force-pull-button"
    >
      {syncing ? 'Syncing...' : 'Force Pull (overwrite local)'}
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
