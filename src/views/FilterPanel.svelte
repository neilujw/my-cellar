<script lang="ts">
  /** Collapsible filter panel for searching and filtering bottles. */
  import { WineType } from '../lib/types';
  import {
    countActiveFilters,
    createEmptyFilters,
    parseOptionalNumber,
    type SearchFilters,
  } from '../lib/search-utils';

  interface Props {
    filters: SearchFilters;
    countries: readonly string[];
    regions: readonly string[];
    onchange: (filters: SearchFilters) => void;
  }

  let { filters, countries, regions, onchange }: Props = $props();
  let open = $state(false);
  const activeCount = $derived(countActiveFilters(filters));

  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red',
    [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé',
    [WineType.Sparkling]: 'Sparkling',
  };

  function toggleType(type: WineType): void {
    const types = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onchange({ ...filters, types });
  }

  function set<K extends keyof SearchFilters>(key: K, value: SearchFilters[K]): void {
    onchange({ ...filters, [key]: value });
  }

  function clearFilters(): void {
    const empty = createEmptyFilters();
    onchange({ ...filters, types: empty.types, country: empty.country, region: empty.region, vintageMin: empty.vintageMin, vintageMax: empty.vintageMax, minRating: empty.minRating, readyToDrink: empty.readyToDrink });
  }

  const inputClass = 'w-full rounded border border-gray-300 px-2 py-1.5 text-sm';
  const labelClass = 'mb-1 block text-xs font-medium text-gray-500';
</script>

<div data-testid="filter-panel">
  <button
    class="flex w-full items-center justify-between rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700"
    onclick={() => (open = !open)}
    data-testid="filter-toggle"
  >
    <span>
      Filters
      {#if activeCount > 0}
        <span class="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white" data-testid="filter-count">{activeCount}</span>
      {/if}
    </span>
    <span class="text-gray-400">{open ? '▲' : '▼'}</span>
  </button>

  {#if open}
    <div class="mt-2 space-y-3 rounded-lg border border-gray-200 p-3" data-testid="filter-content">
      <div>
        <p class="mb-1 text-xs font-medium text-gray-500">Type</p>
        <div class="flex flex-wrap gap-1">
          {#each Object.values(WineType) as wineType (wineType)}
            <button
              class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors {filters.types.includes(wineType) ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}"
              onclick={() => toggleType(wineType)}
              data-testid="filter-type-{wineType}"
            >{typeLabels[wineType]}</button>
          {/each}
        </div>
      </div>

      <div>
        <label for="filter-country" class={labelClass}>Country</label>
        <select id="filter-country" class={inputClass} value={filters.country} onchange={(e) => set('country', e.currentTarget.value)} data-testid="filter-country">
          <option value="">All countries</option>
          {#each countries as country (country)}<option value={country}>{country}</option>{/each}
        </select>
      </div>

      <div>
        <label for="filter-region" class={labelClass}>Region</label>
        <select id="filter-region" class={inputClass} value={filters.region} onchange={(e) => set('region', e.currentTarget.value)} data-testid="filter-region">
          <option value="">All regions</option>
          {#each regions as region (region)}<option value={region}>{region}</option>{/each}
        </select>
      </div>

      <div>
        <p class="mb-1 text-xs font-medium text-gray-500">Vintage</p>
        <div class="flex gap-2">
          <input type="number" placeholder="Min" class={inputClass} value={filters.vintageMin ?? ''} onchange={(e) => set('vintageMin', parseOptionalNumber(e.currentTarget.value))} data-testid="filter-vintage-min" />
          <input type="number" placeholder="Max" class={inputClass} value={filters.vintageMax ?? ''} onchange={(e) => set('vintageMax', parseOptionalNumber(e.currentTarget.value))} data-testid="filter-vintage-max" />
        </div>
      </div>

      <div>
        <label for="filter-rating" class={labelClass}>Minimum rating</label>
        <input id="filter-rating" type="number" min="1" max="10" placeholder="Any" class={inputClass} value={filters.minRating ?? ''} onchange={(e) => set('minRating', parseOptionalNumber(e.currentTarget.value))} data-testid="filter-rating" />
      </div>

      <div class="flex items-center gap-2">
        <input id="filter-ready-to-drink" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600" checked={filters.readyToDrink} onchange={(e) => set('readyToDrink', e.currentTarget.checked)} data-testid="filter-ready-to-drink" />
        <label for="filter-ready-to-drink" class="text-sm text-gray-700">Ready to drink</label>
      </div>

      <button
        class="w-full rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        onclick={clearFilters}
        data-testid="filter-clear"
      >Clear all filters</button>
    </div>
  {/if}
</div>
