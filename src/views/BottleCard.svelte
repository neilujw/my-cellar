<script lang="ts">
  /** Read-only card displaying a bottle's key information. */
  import { WineType, type Bottle } from '../lib/types';
  import { calculateQuantity } from '../lib/bottle-utils';

  interface Props {
    bottle: Bottle;
  }

  let { bottle }: Props = $props();

  const quantity = $derived(calculateQuantity(bottle.history));

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
</script>

<div class="rounded-lg border border-gray-200 bg-white p-3" data-testid="bottle-card">
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

  <div class="mt-2 flex items-center gap-3 text-sm text-gray-600">
    <span data-testid="bottle-card-vintage">{bottle.vintage}</span>
    <span data-testid="bottle-card-quantity">{quantity} bottle{quantity !== 1 ? 's' : ''}</span>
    {#if bottle.rating !== undefined}
      <span data-testid="bottle-card-rating">{bottle.rating}/10</span>
    {/if}
  </div>
</div>
