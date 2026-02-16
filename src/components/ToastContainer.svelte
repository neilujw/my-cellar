<script lang="ts">
  /**
   * Renders active toast notifications as a fixed overlay.
   * Toasts stack from the bottom of the screen above the nav bar.
   */
  import { getToasts, dismissToast, ToastVariant } from '../lib/toast.svelte';

  const variantStyles: Record<ToastVariant, string> = {
    [ToastVariant.Success]: 'bg-green-600 text-white',
    [ToastVariant.Error]: 'bg-red-600 text-white',
    [ToastVariant.Info]: 'bg-blue-600 text-white',
  };
</script>

{#if getToasts().length > 0}
  <div class="fixed bottom-16 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4" data-testid="toast-container">
    {#each getToasts() as toast (toast.id)}
      <div
        class="flex w-full max-w-sm items-center justify-between rounded-lg px-4 py-3 shadow-lg {variantStyles[toast.variant]}"
        role="status"
        data-testid="toast-{toast.variant}"
      >
        <span class="text-sm font-medium">{toast.message}</span>
        <button
          type="button"
          class="ml-3 text-sm font-bold opacity-80 hover:opacity-100"
          onclick={() => dismissToast(toast.id)}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
{/if}
