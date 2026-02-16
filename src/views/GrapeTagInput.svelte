<script lang="ts">
  /** Free-text tag input for grape varieties. Enter or comma adds a tag. */
  interface Props {
    tags: readonly string[];
    onchange: (tags: readonly string[]) => void;
    disabled?: boolean;
  }

  let { tags, onchange, disabled = false }: Props = $props();
  let inputValue = $state('');

  function addTag(value: string): void {
    const tag = value.trim();
    if (tag && !tags.includes(tag)) {
      onchange([...tags, tag]);
    }
    inputValue = '';
  }

  function removeTag(tag: string): void {
    onchange(tags.filter((t) => t !== tag));
  }

  function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(inputValue);
    }
  }
</script>

<div>
  <label for="grape" class="block text-sm font-medium text-gray-700">Grape Varieties</label>
  <div class="mt-1 flex flex-wrap gap-1" data-testid="grape-tags">
    {#each tags as tag (tag)}
      <span class="inline-flex items-center rounded bg-indigo-100 px-2 py-1 text-sm text-indigo-700">
        {tag}
        <button type="button" class="ml-1 text-indigo-500 hover:text-indigo-800" onclick={() => removeTag(tag)} data-testid="remove-grape-{tag}">&times;</button>
      </span>
    {/each}
  </div>
  <input id="grape" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" placeholder="Type and press Enter" {disabled} value={inputValue} oninput={(e) => { inputValue = e.currentTarget.value; }} onkeydown={onKeydown} data-testid="input-grape" />
</div>
