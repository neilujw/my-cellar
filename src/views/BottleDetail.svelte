<script lang="ts">
  /** Full-page detail modal showing all bottle fields and history. */
  import { WineType, type Bottle } from '../lib/types';
  import { calculateQuantity } from '../lib/bottle-utils';
  import { consumeBottle, removeBottle } from '../lib/bottle-actions';
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

  const typeLabels: Record<WineType, string> = { [WineType.Red]: 'Red', [WineType.White]: 'White', [WineType.Rose]: 'Rosé', [WineType.Sparkling]: 'Sparkling' };

  function renderStars(rating: number): string {
    const stars = Math.min(5, Math.max(1, Math.round(rating)));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }
  const typeBadgeColors: Record<WineType, string> = { [WineType.Red]: 'bg-red-100 text-red-800', [WineType.White]: 'bg-yellow-100 text-yellow-800', [WineType.Rose]: 'bg-pink-100 text-pink-800', [WineType.Sparkling]: 'bg-amber-100 text-amber-800' };

  function handleEditSave(updated: Bottle): void {
    currentBottle = updated;
    showEdit = false;
    onupdate(updated);
  }

  async function handleConsume(): Promise<void> {
    const snapshot = $state.snapshot(currentBottle);
    const updated = await consumeBottle(snapshot);
    currentBottle = updated;
    onupdate(updated);
  }

  async function handleRemove(): Promise<void> {
    const snapshot = $state.snapshot(currentBottle);
    const updated = await removeBottle(snapshot);
    currentBottle = updated;
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
          <div class="flex items-center justify-between">
            <p class="font-semibold" data-testid="detail-quantity">{quantity} bottle{quantity !== 1 ? 's' : ''}</p>
            {#if quantity > 0}
              <div class="flex gap-1">
                <button type="button" class="rounded p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors" data-testid="detail-consume" onclick={handleConsume} aria-label="Consume 1 bottle">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M8 22h8M12 11v11M6 2h12l-4 9a5 5 0 0 1-8 0L6 2z"/>
                  </svg>
                </button>
                <button type="button" class="rounded px-1.5 py-0.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors" data-testid="detail-remove" onclick={handleRemove} aria-label="Remove 1 bottle">✕</button>
              </div>
            {/if}
          </div>
        </div>
        {#if currentBottle.rating !== undefined}
          <div class="rounded-lg bg-gray-50 p-3">
            <p class="text-xs text-gray-500">Rating</p>
            <p class="font-semibold" data-testid="detail-rating" aria-label="Rating {currentBottle.rating} out of 5">{renderStars(currentBottle.rating!)}</p>
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

      <!-- Drink from -->
      {#if currentBottle.consumeStartingFrom !== undefined}
        <section>
          <h4 class="text-sm font-semibold text-gray-700">Drinking Window</h4>
          <p class="mt-1 text-sm text-gray-600" data-testid="detail-consume-starting-from">Drink from {currentBottle.consumeStartingFrom}</p>
        </section>
      {/if}

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
