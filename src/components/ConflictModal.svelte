<script lang="ts">
  /**
   * Modal dialog for resolving sync conflicts.
   * Presents two options: create a GitHub PR or overwrite local data with remote.
   * Dispatches 'conflict-resolved' event on successful resolution.
   */
  import type { OctokitClient } from '../lib/github-client';
  import type { Bottle, SyncResult } from '../lib/types';
  import { createConflictPR, resolveConflictWithRemote } from '../lib/github-sync';
  import { setLastSyncedCommitSha } from '../lib/github-settings';
  import { clearAll, addBottle, clearSyncQueue, getAllBottles } from '../lib/storage';
  import { cancelRetries } from '../lib/sync-manager';

  interface Props {
    /** Authenticated Octokit client. */
    readonly client: OctokitClient;
    /** Repository in "owner/repo" format. */
    readonly repo: string;
  }

  let { client, repo }: Props = $props();

  let loading = $state(false);
  let result = $state<SyncResult | null>(null);

  /** Dispatches sync-status-changed event to update header indicator. */
  function dispatchSyncStatus(status: string, pendingCount: number = 0): void {
    window.dispatchEvent(
      new CustomEvent('sync-status-changed', { detail: { status, pendingCount } }),
    );
  }

  /** Creates a PR with local changes on a conflict branch. */
  async function handleCreatePR(): Promise<void> {
    loading = true;
    result = null;

    const bottles = await getAllBottles();
    const prResult = await createConflictPR(client, repo, bottles);

    result = prResult;
    loading = false;

    if (prResult.status === 'success') {
      dispatchSyncStatus('connected');
      dispatchConflictResolved();
    }
  }

  /** Overwrites local data with remote state. */
  async function handleOverwriteLocal(): Promise<void> {
    loading = true;
    result = null;

    const overwriteResult = await resolveConflictWithRemote(client, repo);

    if (overwriteResult.status === 'success' && overwriteResult.bottles) {
      await clearAll();
      for (const bottle of overwriteResult.bottles) {
        await addBottle(bottle);
      }
      cancelRetries();
      await clearSyncQueue();
      if (overwriteResult.commitSha) {
        setLastSyncedCommitSha(overwriteResult.commitSha);
      }
      dispatchSyncStatus('connected');
      dispatchConflictResolved();
    } else {
      result = overwriteResult;
    }

    loading = false;
  }

  /** Dispatches conflict-resolved custom event. */
  function dispatchConflictResolved(): void {
    window.dispatchEvent(new CustomEvent('conflict-resolved'));
  }
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
  data-testid="conflict-modal"
>
  <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
    <h2 class="text-lg font-bold text-gray-900">Sync Conflict Detected</h2>
    <p class="mt-2 text-sm text-gray-600">
      The remote repository has changed since your last sync. Choose how to resolve:
    </p>

    <div class="mt-4 flex flex-col gap-3">
      <button
        type="button"
        class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        onclick={handleCreatePR}
        disabled={loading}
        data-testid="create-pr-button"
      >
        {loading ? 'Processing...' : 'Create Pull Request'}
      </button>

      <button
        type="button"
        class="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        onclick={handleOverwriteLocal}
        disabled={loading}
        data-testid="overwrite-local-button"
      >
        {loading ? 'Processing...' : 'Use Remote Data'}
      </button>
    </div>

    {#if result}
      {#if result.status === 'success'}
        <div
          class="mt-3 rounded border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"
          data-testid="conflict-success"
        >
          {result.message}
        </div>
      {:else}
        <div
          class="mt-3 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          data-testid="conflict-error"
        >
          {result.message}
        </div>
      {/if}
    {/if}
  </div>
</div>
