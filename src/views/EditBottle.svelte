<script lang="ts">
  /**
   * Modal overlay for editing non-key bottle fields.
   * Key fields (name, vintage, type) are shown as disabled for context.
   */
  import { WineType, type Bottle } from '../lib/types';
  import { updateBottle, getAllBottles } from '../lib/storage';
  import { attemptSync } from '../lib/sync-manager';
  import { toastSuccess, toastError } from '../lib/toast.svelte';
  import { getUniqueCountries, getUniqueRegions } from '../lib/search-utils';
  import { validateRating, buildUpdatedBottle } from '../lib/edit-bottle-utils';
  import TextAutocomplete from './TextAutocomplete.svelte';
  import GrapeTagInput from './GrapeTagInput.svelte';
  import FormField from './FormField.svelte';

  interface Props {
    bottle: Bottle;
    onclose: () => void;
    onsave: (updated: Bottle) => void;
  }

  let { bottle, onclose, onsave }: Props = $props();

  let rating = $state(bottle.rating !== undefined ? String(bottle.rating) : '');
  let notes = $state(bottle.notes ?? '');
  let location = $state(bottle.location ?? '');
  let country = $state(bottle.country);
  let region = $state(bottle.region ?? '');
  let grapeVariety = $state<readonly string[]>(bottle.grapeVariety);
  let ratingError = $state('');
  let saving = $state(false);
  let allBottles = $state<Bottle[]>([]);

  getAllBottles().then((bottles) => { allBottles = bottles; });

  const countries = $derived(getUniqueCountries(allBottles));
  const regions = $derived(getUniqueRegions(allBottles));
  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red', [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé', [WineType.Sparkling]: 'Sparkling',
  };

  async function handleSave(): Promise<void> {
    ratingError = validateRating(rating);
    if (ratingError) return;
    saving = true;
    try {
      const updated = buildUpdatedBottle(bottle, { rating, notes, location, country, region, grapeVariety });
      await updateBottle(updated);
      attemptSync(`Updated bottle: ${bottle.name} ${bottle.vintage}`);
      toastSuccess(`Updated ${bottle.name} ${bottle.vintage}`);
      onsave(updated);
    } catch (error) {
      toastError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      saving = false;
    }
  }
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="edit-bottle-modal">
  <div class="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-900">Edit Bottle</h2>
      <button type="button" class="text-2xl leading-none text-gray-400 hover:text-gray-600" onclick={onclose} data-testid="edit-close-button" aria-label="Close">&times;</button>
    </div>

    <form class="mt-4 space-y-4" onsubmit={(e) => { e.preventDefault(); handleSave(); }} data-testid="edit-bottle-form">
      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold text-gray-700">Wine Details (read-only)</legend>
        <FormField label="Name" id="edit-name">
          <input id="edit-name" type="text" class="mt-1 block w-full rounded border border-gray-300 bg-gray-100 px-3 py-2" value={bottle.name} disabled data-testid="edit-input-name" />
        </FormField>
        <div class="grid grid-cols-2 gap-3">
          <FormField label="Vintage" id="edit-vintage">
            <input id="edit-vintage" type="number" class="mt-1 block w-full rounded border border-gray-300 bg-gray-100 px-3 py-2" value={bottle.vintage} disabled data-testid="edit-input-vintage" />
          </FormField>
          <FormField label="Type" id="edit-type">
            <input id="edit-type" type="text" class="mt-1 block w-full rounded border border-gray-300 bg-gray-100 px-3 py-2" value={typeLabels[bottle.type]} disabled data-testid="edit-input-type" />
          </FormField>
        </div>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold text-gray-700">Origin</legend>
        <div class="grid grid-cols-2 gap-3">
          <TextAutocomplete value={country} suggestions={countries} oninput={(v) => { country = v; }} label="Country" id="edit-country" />
          <TextAutocomplete value={region} suggestions={regions} oninput={(v) => { region = v; }} label="Region" id="edit-region" />
        </div>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold text-gray-700">Characteristics</legend>
        <GrapeTagInput tags={grapeVariety} onchange={(tags) => { grapeVariety = tags; }} />
        <FormField label="Rating (1-10)" id="edit-rating" error={ratingError} errorTestId="error-edit-rating">
          <input id="edit-rating" type="number" min="1" max="10" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={rating} oninput={(e) => { rating = e.currentTarget.value; }} data-testid="edit-input-rating" />
        </FormField>
      </fieldset>

      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold text-gray-700">Storage & Notes</legend>
        <FormField label="Location" id="edit-location">
          <input id="edit-location" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={location} oninput={(e) => { location = e.currentTarget.value; }} data-testid="edit-input-location" />
        </FormField>
        <FormField label="Notes" id="edit-notes">
          <textarea id="edit-notes" rows="3" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={notes} oninput={(e) => { notes = e.currentTarget.value; }} data-testid="edit-input-notes"></textarea>
        </FormField>
      </fieldset>

      <div class="flex gap-3">
        <button type="submit" class="flex-1 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50" disabled={saving} data-testid="edit-save-button">
          {saving ? 'Saving...' : 'Save'}
        </button>
        <button type="button" class="flex-1 rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-50" onclick={onclose} data-testid="edit-cancel-button">
          Cancel
        </button>
      </div>
    </form>
  </div>
</div>
