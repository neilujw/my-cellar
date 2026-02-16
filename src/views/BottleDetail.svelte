<script lang="ts">
  /** Full-page detail modal showing all bottle fields and history. */
  import { WineType, type Bottle } from '../lib/types';
  import { calculateQuantity } from '../lib/bottle-utils';
  import HistoryTimeline from './HistoryTimeline.svelte';
  import EditBottle from './EditBottle.svelte';

  interface Props {
    bottle: Bottle;
    onclose: () => void;
    onupdate: (updated: Bottle) => void;
  }

  let { bottle, onclose, onupdate }: Props = $props();

  let currentBottle = $state(bottle);
  let showEdit = $state(false);

  const quantity = $derived(calculateQuantity(currentBottle.history));

  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red', [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé', [WineType.Sparkling]: 'Sparkling',
  };

  const typeBadgeColors: Record<WineType, string> = {
    [WineType.Red]: 'bg-red-100 text-red-800',
    [WineType.White]: 'bg-yellow-100 text-yellow-800',
    [WineType.Rose]: 'bg-pink-100 text-pink-800',
    [WineType.Sparkling]: 'bg-amber-100 text-amber-800',
  };

  function handleEditSave(updated: Bottle): void {
    currentBottle = updated;
    showEdit = false;
    onupdate(updated);
  }
</script>

<div class="fixed inset-0 z-40 flex flex-col bg-white" data-testid="bottle-detail-modal">
  <!-- Header -->
  <header class="flex items-center justify-between border-b border-gray-200 px-4 py-3">
    <button type="button" class="text-sm font-medium text-indigo-600" onclick={onclose} data-testid="detail-close-button">
      Close
    </button>
    <h2 class="text-lg font-bold">Details</h2>
    <button type="button" class="text-sm font-medium text-indigo-600" onclick={() => { showEdit = true; }} data-testid="detail-edit-button">
      Edit
    </button>
  </header>

  <!-- Content -->
  <div class="flex-1 overflow-y-auto p-4">
    <div class="space-y-4">
      <!-- Name and type badge -->
      <div>
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-xl font-bold text-gray-900" data-testid="detail-name">{currentBottle.name}</h3>
          <span class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {typeBadgeColors[currentBottle.type]}" data-testid="detail-type">
            {typeLabels[currentBottle.type]}
          </span>
        </div>
        <p class="mt-1 text-sm text-gray-500" data-testid="detail-vintage">Vintage {currentBottle.vintage}</p>
      </div>

      <!-- Key info grid -->
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-gray-50 p-3">
          <p class="text-xs text-gray-500">Quantity</p>
          <p class="font-semibold" data-testid="detail-quantity">{quantity} bottle{quantity !== 1 ? 's' : ''}</p>
        </div>
        {#if currentBottle.rating !== undefined}
          <div class="rounded-lg bg-gray-50 p-3">
            <p class="text-xs text-gray-500">Rating</p>
            <p class="font-semibold" data-testid="detail-rating">{currentBottle.rating}/10</p>
          </div>
        {/if}
      </div>

      <!-- Origin -->
      <section>
        <h4 class="text-sm font-semibold text-gray-700">Origin</h4>
        <p class="mt-1 text-sm text-gray-600" data-testid="detail-origin">
          {currentBottle.country}{currentBottle.region ? ` — ${currentBottle.region}` : ''}
        </p>
        {#if currentBottle.grapeVariety.length > 0}
          <div class="mt-2 flex flex-wrap gap-1" data-testid="detail-grapes">
            {#each currentBottle.grapeVariety as grape (grape)}
              <span class="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">{grape}</span>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Location -->
      {#if currentBottle.location}
        <section>
          <h4 class="text-sm font-semibold text-gray-700">Location</h4>
          <p class="mt-1 text-sm text-gray-600" data-testid="detail-location">{currentBottle.location}</p>
        </section>
      {/if}

      <!-- Notes -->
      {#if currentBottle.notes}
        <section>
          <h4 class="text-sm font-semibold text-gray-700">Notes</h4>
          <p class="mt-1 text-sm text-gray-600" data-testid="detail-notes">{currentBottle.notes}</p>
        </section>
      {/if}

      <!-- History -->
      <section>
        <h4 class="text-sm font-semibold text-gray-700">History</h4>
        <div class="mt-2">
          <HistoryTimeline history={currentBottle.history} />
        </div>
      </section>
    </div>
  </div>
</div>

{#if showEdit}
  <EditBottle bottle={currentBottle} onclose={() => { showEdit = false; }} onsave={handleEditSave} />
{/if}
