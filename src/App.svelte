<script lang="ts">
  /**
   * Main application layout with header, content area, and bottom tab bar.
   * Renders the current view based on the hash router state.
   */
  import { getCurrentRoute, navigate } from './lib/router.svelte.ts';
  import type { Route } from './lib/router.svelte.ts';
  import type { SyncStatus } from './lib/types';
  import { loadSettings } from './lib/github-settings';
  import Dashboard from './views/Dashboard.svelte';
  import AddBottle from './views/AddBottle.svelte';
  import Search from './views/Search.svelte';
  import Settings from './views/Settings.svelte';

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

  // Listen for settings changes from the Settings view
  $effect(() => {
    function handleSettingsChanged(): void {
      syncStatus = getSyncStatus();
    }
    window.addEventListener('settings-changed', handleSettingsChanged);
    return () => window.removeEventListener('settings-changed', handleSettingsChanged);
  });

  const syncStatusLabels: Record<SyncStatus, string> = {
    'not-configured': 'Not configured',
    connected: 'Connected',
    offline: 'Offline',
  };

  const syncStatusColors: Record<SyncStatus, string> = {
    'not-configured': 'text-gray-400',
    connected: 'text-green-600',
    offline: 'text-amber-500',
  };

  function handleTabClick(route: Route): void {
    navigate(route);
  }
</script>

<div class="flex h-full flex-col">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
    <h1 class="text-lg font-bold">My Cellar</h1>
    <span class="text-sm {syncStatusColors[syncStatus]}" data-testid="sync-status">{syncStatusLabels[syncStatus]}</span>
  </header>

  <!-- Content area -->
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

  <!-- Bottom tab bar -->
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
