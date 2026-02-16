<script lang="ts">
  /**
   * Dashboard view — overview of cellar with inventory, statistics, and recent activity.
   * Shows an empty state with CTA when no bottles exist.
   */
  import { getAllBottles } from '../lib/storage';
  import { navigate } from '../lib/router.svelte.ts';
  import { WineType, type Bottle } from '../lib/types';
  import {
    formatAction,
    getRecentActivity,
    getRecentBottles,
    getStatsByType,
    getTotalBottleCount,
    getTopRegions,
  } from '../lib/dashboard-utils';
  import BottleCard from './BottleCard.svelte';
  import BottleDetail from './BottleDetail.svelte';

  let bottles = $state<Bottle[]>([]);
  let loaded = $state(false);
  let selectedBottle = $state<Bottle | null>(null);

  /** Load bottles from IndexedDB on mount. */
  function loadBottles(): void {
    getAllBottles()
      .then((data) => {
        bottles = data;
      })
      .catch(() => {
        bottles = [];
      })
      .finally(() => {
        loaded = true;
      });
  }
  $effect(() => {
    loadBottles();
  });

  const totalCount = $derived(getTotalBottleCount(bottles));
  const statsByType = $derived(getStatsByType(bottles));
  const topRegions = $derived(getTopRegions(bottles, 3));
  const recentActivity = $derived(getRecentActivity(bottles, 10));
  const recentBottles = $derived(getRecentBottles(bottles, 5));
  const hasBottles = $derived(bottles.length > 0);

  function handleBottleUpdate(): void {
    selectedBottle = null;
    loadBottles();
  }

  /** Labels for wine type display. */
  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red',
    [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé',
    [WineType.Sparkling]: 'Sparkling',
  };
</script>

{#if !loaded}
  <div class="p-4 text-center text-gray-400">Loading...</div>
{:else if !hasBottles}
  <div class="flex flex-col items-center justify-center px-4 py-16" data-testid="empty-state">
    <h2 class="text-2xl font-bold">Dashboard</h2>
    <p class="mt-4 text-center text-gray-600">
      Your cellar is empty. Start building your collection!
    </p>
    <button
      class="mt-6 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
      onclick={() => navigate('/add')}
      data-testid="cta-add-bottle"
    >
      Add your first bottle
    </button>
  </div>
{:else}
  <div class="p-4">
    <h2 class="text-2xl font-bold">Dashboard</h2>

    <!-- Statistics -->
    <section class="mt-4" aria-label="Cellar statistics">
      <div class="rounded-lg bg-indigo-50 p-4 text-center">
        <p class="text-3xl font-bold text-indigo-600" data-testid="total-count">{totalCount}</p>
        <p class="text-sm text-gray-600">bottles in cellar</p>
      </div>

      <div class="mt-3 grid grid-cols-2 gap-2" data-testid="type-breakdown">
        {#each Object.values(WineType) as wineType (wineType)}
          <div class="rounded-lg bg-gray-50 p-3 text-center">
            <p class="text-lg font-semibold">{statsByType[wineType]}</p>
            <p class="text-xs text-gray-500">{typeLabels[wineType]}</p>
          </div>
        {/each}
      </div>

      {#if topRegions.length > 0}
        <div class="mt-3" data-testid="top-regions">
          <h3 class="text-sm font-semibold text-gray-700">Top Regions</h3>
          <ul class="mt-1 space-y-1">
            {#each topRegions as region (region.region)}
              <li class="flex justify-between rounded bg-gray-50 px-3 py-2 text-sm">
                <span>{region.region}</span>
                <span class="font-medium">{region.count}</span>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    <!-- Recent Bottles -->
    {#if recentBottles.length > 0}
      <section class="mt-6" aria-label="Recent bottles">
        <h3 class="text-sm font-semibold text-gray-700">Recent Bottles</h3>
        <div class="mt-2 space-y-2" data-testid="recent-bottles">
          {#each recentBottles as bottle (bottle.id)}
            <BottleCard {bottle} onclick={(b) => { selectedBottle = b; }} />
          {/each}
        </div>
      </section>
    {/if}

    <!-- Recent Activity -->
    {#if recentActivity.length > 0}
      <section class="mt-6" aria-label="Recent activity">
        <h3 class="text-sm font-semibold text-gray-700">Recent Activity</h3>
        <ul class="mt-2 space-y-1" data-testid="recent-activity">
          {#each recentActivity as entry (entry.date + entry.bottleName + entry.quantity)}
            <li class="rounded bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {entry.date} &bull; {formatAction(entry.action)} {entry.quantity}&times; {entry.bottleName}
              {entry.vintage}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </div>
{/if}

{#if selectedBottle}
  <BottleDetail bottle={selectedBottle} onclose={() => { selectedBottle = null; }} onupdate={handleBottleUpdate} />
{/if}
