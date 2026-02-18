<script lang="ts">
  /**
   * Sync button displayed in the header.
   * Shows an upload icon when changes are pending, download icon when synced,
   * spinning icon while syncing, and warning icon on conflict.
   * Clicking triggers manualPush (pending > 0) or manualPull (pending === 0).
   */
  import type { SyncStatus } from '../lib/types';
  import { manualPush, manualPull } from '../lib/sync-manager';

  interface Props {
    /** Current synchronization status. */
    readonly syncStatus: SyncStatus;
    /** Number of pending mutations in the sync queue. */
    readonly pendingCount: number;
  }

  let { syncStatus, pendingCount }: Props = $props();

  const disabled = $derived(syncStatus === 'syncing' || syncStatus === 'conflict');

  const label = $derived.by(() => {
    if (pendingCount > 0) return `${pendingCount} pending`;
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'error') return 'Error';
    if (syncStatus === 'conflict') return 'Conflict';
    return 'Synced';
  });

  const colorClass = $derived.by(() => {
    if (syncStatus === 'syncing') return 'text-blue-500';
    if (syncStatus === 'error') return 'text-red-600';
    if (syncStatus === 'conflict') return 'text-orange-500';
    if (pendingCount > 0) return 'text-amber-500';
    return 'text-green-600';
  });

  async function handleClick(): Promise<void> {
    if (disabled) return;
    if (pendingCount > 0) {
      await manualPush();
    } else {
      await manualPull();
    }
  }
</script>

{#if syncStatus !== 'not-configured'}
  <button
    type="button"
    class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-100 disabled:opacity-50 {colorClass}"
    onclick={handleClick}
    {disabled}
    data-testid="sync-button"
  >
    {#if syncStatus === 'syncing'}
      <!-- Spinning circular arrows -->
      <svg class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M4 12a8 8 0 0 1 14.93-4M20 12a8 8 0 0 1-14.93 4" />
        <path d="M4 8v4h4M20 16v-4h-4" />
      </svg>
    {:else if syncStatus === 'conflict'}
      <!-- Warning/exclamation -->
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    {:else if pendingCount > 0 || syncStatus === 'error'}
      <!-- Upload arrow -->
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    {:else}
      <!-- Refresh / circular arrows -->
      <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <polyline points="23 20 23 14 17 14" />
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15" />
      </svg>
    {/if}

    {#if pendingCount > 0}
      <span
        class="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white"
        data-testid="sync-badge"
      >
        {pendingCount}
      </span>
    {/if}

    <span class="text-xs">{label}</span>
  </button>
{/if}
