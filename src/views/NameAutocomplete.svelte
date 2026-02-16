<script lang="ts">
  /**
   * Autocomplete input for bottle names.
   * Shows a dropdown of matching bottles when 2+ characters are typed.
   * Supports keyboard navigation (arrow keys, Enter, Escape).
   */
  import type { Bottle } from '../lib/types';
  import { searchBottlesByName } from '../lib/bottle-utils';
  import { calculateQuantity } from '../lib/bottle-utils';
  import FormField from './FormField.svelte';

  interface Props {
    value: string;
    bottles: readonly Bottle[];
    oninput: (value: string) => void;
    onselect: (bottle: Bottle) => void;
    error?: string;
    disabled?: boolean;
  }

  let { value, bottles, oninput, onselect, error, disabled = false }: Props = $props();

  let showDropdown = $state(false);
  let activeIndex = $state(-1);

  const typeLabels: Record<string, string> = {
    red: 'Red',
    white: 'White',
    'rosé': 'Rosé',
    sparkling: 'Sparkling',
  };

  let matches = $derived(searchBottlesByName(bottles, value));

  function handleInput(event: Event): void {
    const inputValue = (event.currentTarget as HTMLInputElement).value;
    oninput(inputValue);
    activeIndex = -1;
    showDropdown = true;
  }

  function handleFocus(): void {
    if (value.length >= 2 && matches.length > 0) {
      showDropdown = true;
    }
  }

  function handleBlur(): void {
    // Delay to allow click on dropdown item to register
    setTimeout(() => {
      showDropdown = false;
      activeIndex = -1;
    }, 200);
  }

  function selectBottle(bottle: Bottle): void {
    showDropdown = false;
    activeIndex = -1;
    onselect(bottle);
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!showDropdown || matches.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = activeIndex < matches.length - 1 ? activeIndex + 1 : 0;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = activeIndex > 0 ? activeIndex - 1 : matches.length - 1;
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectBottle(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      showDropdown = false;
      activeIndex = -1;
    }
  }
</script>

<FormField label="Name *" id="name" {error} errorTestId="error-name">
  <div class="relative">
    <input
      id="name"
      type="text"
      class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
      {value}
      {disabled}
      oninput={handleInput}
      onfocus={handleFocus}
      onblur={handleBlur}
      onkeydown={handleKeydown}
      autocomplete="off"
      role="combobox"
      aria-expanded={showDropdown && matches.length > 0}
      aria-autocomplete="list"
      aria-controls="name-autocomplete-list"
      aria-activedescendant={activeIndex >= 0 ? `autocomplete-item-${activeIndex}` : undefined}
      data-testid="input-name"
    />
    {#if showDropdown && value.length >= 2}
      <ul
        id="name-autocomplete-list"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg"
        role="listbox"
        data-testid="autocomplete-dropdown"
      >
        {#if matches.length === 0}
          <li class="px-3 py-2 text-sm text-gray-500" data-testid="autocomplete-no-matches">
            No matches
          </li>
        {:else}
          {#each matches as bottle, index (bottle.id)}
            <li
              id="autocomplete-item-{index}"
              class="cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50"
              class:bg-indigo-100={index === activeIndex}
              role="option"
              aria-selected={index === activeIndex}
              onmousedown={() => selectBottle(bottle)}
              data-testid="autocomplete-item-{index}"
            >
              <span class="font-medium">{bottle.name}</span>
              <span class="ml-1 text-gray-500">{bottle.vintage}</span>
              <span class="ml-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium
                {bottle.type === 'red' ? 'bg-red-100 text-red-700' : ''}
                {bottle.type === 'white' ? 'bg-yellow-100 text-yellow-700' : ''}
                {bottle.type === 'rosé' ? 'bg-pink-100 text-pink-700' : ''}
                {bottle.type === 'sparkling' ? 'bg-emerald-100 text-emerald-700' : ''}"
              >
                {typeLabels[bottle.type] ?? bottle.type}
              </span>
              <span class="ml-1 text-gray-400">×{calculateQuantity(bottle.history)}</span>
            </li>
          {/each}
        {/if}
      </ul>
    {/if}
  </div>
</FormField>
