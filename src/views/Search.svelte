<script lang="ts">
  /** Search view — search, filter, and sort wines in the cellar. */
  import { getAllBottles } from '../lib/storage';
  import { navigate } from '../lib/router.svelte.ts';
  import { type Bottle } from '../lib/types';
  import {
    createEmptyFilters,
    filterBottles,
    getUniqueCountries,
    getUniqueRegions,
    sortBottles,
    type SearchFilters,
    type SortOption,
  } from '../lib/search-utils';
  import BottleCard from './BottleCard.svelte';
  import BottleDetail from './BottleDetail.svelte';
  import FilterPanel from './FilterPanel.svelte';

  let allBottles = $state<Bottle[]>([]);
  let loaded = $state(false);
  let filters = $state<SearchFilters>(createEmptyFilters());
  let sortOption = $state<SortOption>('name');
  let selectedBottle = $state<Bottle | null>(null);

  /** Load bottles from IndexedDB on mount. */
  function loadBottles(): void {
    getAllBottles().then((data) => {
      allBottles = data;
      loaded = true;
    });
  }
  $effect(loadBottles);

  function handleBottleUpdate(): void {
    selectedBottle = null;
    loadBottles();
  }

  const countries = $derived(getUniqueCountries(allBottles));
  const regions = $derived(getUniqueRegions(allBottles));
  const filteredBottles = $derived(filterBottles(allBottles, filters));
  const sortedBottles = $derived(sortBottles(filteredBottles, sortOption));
  const hasBottles = $derived(allBottles.length > 0);

  /** Sort option display labels. */
  const sortLabels: Record<SortOption, string> = {
    name: 'Name',
    vintage: 'Vintage',
    rating: 'Rating',
    quantity: 'Quantity',
    recentlyAdded: 'Recently added',
  };

  function handleFilterChange(updated: SearchFilters): void { filters = updated; }
  function clearAll(): void { filters = createEmptyFilters(); sortOption = 'name'; }
</script>

{#if !loaded}
  <div class="p-4 text-center text-gray-400">Loading...</div>
{:else if !hasBottles}
  <div
    class="flex flex-col items-center justify-center px-4 py-16"
    data-testid="search-empty-cellar"
  >
    <h2 class="text-2xl font-bold">Search</h2>
    <p class="mt-4 text-center text-gray-600">
      Your cellar is empty. Add some bottles to start searching!
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
    <!-- Search bar and sort -->
    <div class="flex gap-2">
      <input
        type="search"
        placeholder="Search by name..."
        class="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        value={filters.searchText}
        oninput={(e) => (filters = { ...filters, searchText: e.currentTarget.value })}
        data-testid="search-input"
      />
      <select
        class="rounded-lg border border-gray-300 px-2 py-2 text-sm"
        value={sortOption}
        onchange={(e) => (sortOption = e.currentTarget.value as SortOption)}
        data-testid="sort-select"
      >
        {#each Object.entries(sortLabels) as [value, label] (value)}
          <option {value}>{label}</option>
        {/each}
      </select>
    </div>

    <div class="mt-2">
      <FilterPanel {filters} {countries} {regions} onchange={handleFilterChange} />
    </div>

    <!-- Results count and clear -->
    <div class="mt-3 flex items-center justify-between">
      <p class="text-sm text-gray-500" data-testid="results-count">
        {sortedBottles.length} bottle{sortedBottles.length !== 1 ? 's' : ''} found
      </p>
      {#if filters.searchText !== '' || sortOption !== 'name'}
        <button
          class="text-sm text-indigo-600"
          onclick={clearAll}
          data-testid="clear-all"
        >
          Clear all
        </button>
      {/if}
    </div>

    <!-- Results -->
    {#if sortedBottles.length === 0}
      <div class="mt-8 text-center" data-testid="search-no-results">
        <p class="text-gray-500">No bottles match your filters.</p>
        <button
          class="mt-2 text-sm text-indigo-600"
          onclick={clearAll}
        >
          Clear all filters
        </button>
      </div>
    {:else}
      <div class="mt-3 space-y-2" data-testid="search-results">
        {#each sortedBottles as bottle (bottle.id)}
          <BottleCard {bottle} onclick={(b) => { selectedBottle = b; }} />
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if selectedBottle}
  <BottleDetail bottle={selectedBottle} onclose={() => { selectedBottle = null; }} onupdate={handleBottleUpdate} />
{/if}
