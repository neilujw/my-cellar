<script lang="ts">
  /** Reusable form field with label and inline error display. */
  import type { Snippet } from 'svelte';

  interface Props {
    label: string;
    id: string;
    error?: string;
    errorTestId?: string;
    children: Snippet;
  }

  let { label, id, error, errorTestId, children }: Props = $props();
</script>

<div>
  <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
  {@render children()}
  {#if error}<p class="mt-1 text-sm text-red-600" data-testid={errorTestId}>{error}</p>{/if}
</div>
