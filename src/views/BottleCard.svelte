<script lang="ts">
  /** Read-only card displaying a bottle's key information with quick actions. */
  import { WineType, type Bottle } from '../lib/types';
  import { calculateQuantity, formatVintage } from '../lib/bottle-utils';
  import { consumeBottle } from '../lib/bottle-actions';

  interface Props {
    bottle: Bottle;
    onclick?: (bottle: Bottle) => void;
    onupdate?: (bottle: Bottle) => void;
  }

  let { bottle, onclick, onupdate }: Props = $props();

  const quantity = $derived(calculateQuantity(bottle.history));
  const currentYear = new Date().getFullYear();
  const readyToDrink = $derived(
    bottle.consumeStartingFrom !== undefined &&
    bottle.consumeStartingFrom <= currentYear &&
    quantity > 0
  );

  /** Color classes for wine type badges. */
  const typeBadgeColors: Record<WineType, string> = {
    [WineType.Red]: 'bg-red-100 text-red-800',
    [WineType.White]: 'bg-yellow-100 text-yellow-800',
    [WineType.Rose]: 'bg-pink-100 text-pink-800',
    [WineType.Sparkling]: 'bg-amber-100 text-amber-800',
  };

  /** Display labels for wine types. */
  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red',
    [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé',
    [WineType.Sparkling]: 'Sparkling',
  };

  function renderStars(rating: number): string {
    const stars = Math.min(5, Math.max(1, Math.round(rating)));
    return '★'.repeat(stars) + '☆'.repeat(5 - stars);
  }

  async function handleConsume(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const snapshot = $state.snapshot(bottle);
    const updated = await consumeBottle(snapshot);
    onupdate?.(updated);
  }


</script>

<div
  class="rounded-lg border border-gray-200 bg-white p-3 {onclick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-sm transition-all' : ''}"
  data-testid="bottle-card"
  onclick={() => onclick?.(bottle)}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onclick?.(bottle); } }}
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
>
  <div class="flex items-start justify-between gap-2">
    <div class="min-w-0 flex-1">
      <h3 class="truncate font-semibold text-gray-900" data-testid="bottle-card-name">
        {bottle.name}
      </h3>
      <p class="text-sm text-gray-500" data-testid="bottle-card-origin">
        {bottle.country} — {bottle.region}
      </p>
    </div>
    <span
      class="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium {typeBadgeColors[bottle.type]}"
      data-testid="bottle-card-type"
    >
      {typeLabels[bottle.type]}
    </span>
  </div>

  <div class="mt-2 flex items-center justify-between">
    <div class="flex items-center gap-3 text-sm text-gray-600">
      <span data-testid="bottle-card-vintage">{formatVintage(bottle.vintage)}</span>
      <span data-testid="bottle-card-quantity">{quantity} bottle{quantity !== 1 ? 's' : ''}</span>
      {#if bottle.rating !== undefined}
        <span data-testid="bottle-card-rating" aria-label="Rating {bottle.rating} out of 5">{renderStars(bottle.rating)}</span>
      {/if}
      {#if readyToDrink}
        <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800" data-testid="bottle-card-ready">Ready to drink</span>
      {/if}
    </div>

    {#if quantity > 0}
      <button
        type="button"
        class="rounded p-1 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
        data-testid="bottle-card-consume"
        onclick={handleConsume}
        aria-label="Consume 1 bottle"
      >
        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 22h8M12 11v11M6 2h12l-4 9a5 5 0 0 1-8 0L6 2z"/>
        </svg>
      </button>
    {/if}
  </div>
</div>
