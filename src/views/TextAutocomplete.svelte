<script lang="ts">
  /**
   * Generic autocomplete input for string suggestions.
   * Shows a dropdown of all suggestions on focus, filters as the user types.
   * Supports keyboard navigation (arrow keys, Enter, Escape).
   */
  import FormField from './FormField.svelte';

  interface Props {
    value: string;
    suggestions: readonly string[];
    oninput: (value: string) => void;
    label: string;
    id: string;
    error?: string;
    errorTestId?: string;
    disabled?: boolean;
    placeholder?: string;
    required?: boolean;
  }

  let {
    value, suggestions, oninput, label, id,
    error, errorTestId, disabled = false, placeholder, required = false,
  }: Props = $props();

  let showDropdown = $state(false);
  let activeIndex = $state(-1);
  let listId = $derived(`${id}-autocomplete-list`);

  let filteredSuggestions = $derived(
    value === ''
      ? suggestions
      : suggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase())),
  );

  /** Returns the index of the match within suggestion, or -1. */
  function matchIndex(suggestion: string): number {
    if (value === '') return -1;
    return suggestion.toLowerCase().indexOf(value.toLowerCase());
  }

  function handleInput(event: Event): void {
    oninput((event.currentTarget as HTMLInputElement).value);
    activeIndex = -1;
    showDropdown = true;
  }

  function handleFocus(): void {
    if (suggestions.length > 0) showDropdown = true;
  }

  function handleBlur(): void {
    setTimeout(() => { showDropdown = false; activeIndex = -1; }, 200);
  }

  function selectSuggestion(suggestion: string): void {
    oninput(suggestion);
    showDropdown = false;
    activeIndex = -1;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (!showDropdown) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      showDropdown = false;
      activeIndex = -1;
      return;
    }
    if (filteredSuggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = activeIndex < filteredSuggestions.length - 1 ? activeIndex + 1 : 0;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = activeIndex > 0 ? activeIndex - 1 : filteredSuggestions.length - 1;
    } else if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(filteredSuggestions[activeIndex]);
    }
  }
</script>

<FormField {label} {id} {error} {errorTestId}>
  <div class="relative">
    <input
      {id} type="text" {value} {disabled} {placeholder} {required}
      class="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
      oninput={handleInput} onfocus={handleFocus} onblur={handleBlur} onkeydown={handleKeydown}
      autocomplete="off" role="combobox"
      aria-expanded={showDropdown && filteredSuggestions.length > 0}
      aria-autocomplete="list" aria-controls={listId}
      aria-activedescendant={activeIndex >= 0 ? `${id}-autocomplete-item-${activeIndex}` : undefined}
      data-testid="input-{id}"
    />
    {#if showDropdown && suggestions.length > 0}
      <ul id={listId} role="listbox" data-testid="{id}-autocomplete-dropdown"
        class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg">
        {#if filteredSuggestions.length === 0}
          <li class="px-3 py-2 text-sm text-gray-500" data-testid="{id}-autocomplete-no-matches">
            No matches
          </li>
        {:else}
          {#each filteredSuggestions as suggestion, index (suggestion)}
            {@const mi = matchIndex(suggestion)}
            <li id="{id}-autocomplete-item-{index}" role="option"
              class="cursor-pointer px-3 py-2 text-sm hover:bg-indigo-50"
              class:bg-indigo-100={index === activeIndex}
              aria-selected={index === activeIndex}
              onmousedown={() => selectSuggestion(suggestion)}
              data-testid="{id}-autocomplete-item-{index}">
              {#if mi >= 0}
                {suggestion.slice(0, mi)}<mark class="bg-yellow-200">{suggestion.slice(mi, mi + value.length)}</mark>{suggestion.slice(mi + value.length)}
              {:else}
                {suggestion}
              {/if}
            </li>
          {/each}
        {/if}
      </ul>
    {/if}
  </div>
</FormField>
