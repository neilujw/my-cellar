<script lang="ts">
  /**
   * Main application layout with header, content area, and bottom tab bar.
   * Renders the current view based on the hash router state.
   */
  import { getCurrentRoute, navigate } from './lib/router.svelte.ts';
  import type { Route } from './lib/router.svelte.ts';
  import type { SyncStatus } from './lib/types';
  import { loadSettings } from './lib/github-settings';
  import { createGitHubClient } from './lib/github-client';
  import { processQueue } from './lib/sync-manager';
  import Dashboard from './views/Dashboard.svelte';
  import AddBottle from './views/AddBottle.svelte';
  import Search from './views/Search.svelte';
  import Settings from './views/Settings.svelte';
  import ConflictModal from './components/ConflictModal.svelte';
  import ToastContainer from './components/ToastContainer.svelte';

  interface Tab {
    readonly route: Route;
    readonly label: string;
    readonly icon: string;
  }

  const tabs: ReadonlyArray<Tab> = [
    { route: '/', label: 'Dashboard', icon: '📊' },
    { route: '/add', label: 'Add', icon: '➕' },
    { route: '/search', label: 'Search', icon: '🔍' },
    { route: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  /** Derives sync status from stored GitHub settings. */
  function getSyncStatus(): SyncStatus {
    return loadSettings() ? 'connected' : 'not-configured';
  }

  let syncStatus = $state<SyncStatus>(getSyncStatus());
  let pendingCount = $state(0);

  /** Detail payload for sync-status-changed events. */
  interface SyncStatusDetail {
    readonly status: SyncStatus;
    readonly pendingCount?: number;
  }

  $effect(() => {
    function handleSettingsChanged(): void {
      syncStatus = getSyncStatus();
      pendingCount = 0;
    }
    function handleSyncStatusChanged(event: Event): void {
      const detail = (event as CustomEvent<SyncStatusDetail>).detail;
      if (detail.status === 'syncing' || detail.status === 'offline' || detail.status === 'error' || detail.status === 'conflict') {
        syncStatus = detail.status;
      } else if (detail.status === 'connected') {
        syncStatus = 'connected';
      } else {
        syncStatus = getSyncStatus();
      }
      pendingCount = detail.pendingCount ?? 0;
    }
    function handleConflictResolved(): void {
      syncStatus = 'connected';
    }
    window.addEventListener('settings-changed', handleSettingsChanged);
    window.addEventListener('sync-status-changed', handleSyncStatusChanged);
    window.addEventListener('conflict-resolved', handleConflictResolved);
    return () => {
      window.removeEventListener('settings-changed', handleSettingsChanged);
      window.removeEventListener('sync-status-changed', handleSyncStatusChanged);
      window.removeEventListener('conflict-resolved', handleConflictResolved);
    };
  });

  const syncStatusConfig: Record<SyncStatus, { label: string; color: string }> = {
    'not-configured': { label: 'Not configured', color: 'text-gray-400' },
    connected: { label: 'Connected', color: 'text-green-600' },
    offline: { label: 'Offline', color: 'text-amber-500' },
    syncing: { label: 'Syncing...', color: 'text-blue-500' },
    error: { label: 'Error', color: 'text-red-600' },
    conflict: { label: 'Conflict', color: 'text-orange-500' },
  };

  let syncStatusLabel = $derived(() => {
    const base = syncStatusConfig[syncStatus].label;
    if ((syncStatus === 'offline' || syncStatus === 'error') && pendingCount > 0) {
      return `${base} (${pendingCount} pending)`;
    }
    return base;
  });

  $effect(() => {
    if (loadSettings()) {
      processQueue();
    }
  });

  function handleTabClick(route: Route): void {
    navigate(route);
  }
</script>

<div class="flex h-full flex-col">
  <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
    <h1 class="text-lg font-bold">My Cellar</h1>
    <span class="text-sm {syncStatusConfig[syncStatus].color}" data-testid="sync-status">{syncStatusLabel()}</span>
  </header>

  <main class="flex-1 overflow-y-auto">
    {#if getCurrentRoute() === '/'}
      <Dashboard />
    {:else if getCurrentRoute() === '/add'}
      <AddBottle />
    {:else if getCurrentRoute() === '/search'}
      <Search />
    {:else if getCurrentRoute() === '/settings'}
      <Settings />
    {/if}
  </main>

  {#if syncStatus === 'conflict'}
    {@const settings = loadSettings()}
    {#if settings}
      <ConflictModal client={createGitHubClient(settings.pat)} repo={settings.repo} />
    {/if}
  {/if}

  <ToastContainer />

  <nav class="flex border-t border-gray-200 bg-white" aria-label="Main navigation">
    {#each tabs as tab (tab.route)}
      <button
        class="flex flex-1 flex-col items-center py-2 text-xs transition-colors
          {getCurrentRoute() === tab.route
          ? 'text-indigo-600 font-semibold'
          : 'text-gray-500'}"
        onclick={() => handleTabClick(tab.route)}
        aria-current={getCurrentRoute() === tab.route ? 'page' : undefined}
        data-testid="tab-{tab.label.toLowerCase()}"
      >
        <span class="text-lg">{tab.icon}</span>
        <span>{tab.label}</span>
      </button>
    {/each}
  </nav>
</div>
