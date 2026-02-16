<script lang="ts">
  /** Displays a chronological timeline of bottle history entries. */
  import { HistoryAction, type HistoryEntry } from '../lib/types';

  interface Props {
    history: readonly HistoryEntry[];
  }

  let { history }: Props = $props();

  /** Action display labels. */
  const actionLabels: Record<HistoryAction, string> = {
    [HistoryAction.Added]: 'Added',
    [HistoryAction.Consumed]: 'Consumed',
    [HistoryAction.Removed]: 'Removed',
  };

  /** Action badge color classes. */
  const actionColors: Record<HistoryAction, string> = {
    [HistoryAction.Added]: 'bg-green-100 text-green-800',
    [HistoryAction.Consumed]: 'bg-orange-100 text-orange-800',
    [HistoryAction.Removed]: 'bg-red-100 text-red-800',
  };

  const sortedHistory = $derived(
    [...history].sort((a, b) => b.date.localeCompare(a.date)),
  );
</script>

<div data-testid="history-timeline">
  {#if sortedHistory.length === 0}
    <p class="text-sm text-gray-500">No history entries.</p>
  {:else}
    <ul class="space-y-2">
      {#each sortedHistory as entry, index (entry.date + entry.action + index)}
        <li
          class="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
          data-testid="history-entry"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600" data-testid="history-entry-date">{entry.date}</span>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium {actionColors[entry.action]}"
              data-testid="history-entry-action"
            >
              {actionLabels[entry.action]}
            </span>
          </div>
          <div class="mt-1 flex items-center gap-3 text-sm text-gray-700">
            <span data-testid="history-entry-quantity">{entry.quantity} bottle{entry.quantity !== 1 ? 's' : ''}</span>
            {#if entry.price}
              <span data-testid="history-entry-price">{entry.price.amount} {entry.price.currency}</span>
            {/if}
          </div>
          {#if entry.notes}
            <p class="mt-1 text-sm text-gray-500" data-testid="history-entry-notes">{entry.notes}</p>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
