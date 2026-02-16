<script lang="ts">
  /**
   * Add Bottle view — form to add new bottles or update quantity.
   * Features proactive duplicate detection via name autocomplete.
   * When an existing bottle is selected, non-key fields become read-only
   * and submission adds a history entry instead of creating a new bottle.
   */
  import { WineType, type Bottle } from '../lib/types';
  import { navigate } from '../lib/router.svelte';
  import { addBottle, getAllBottles, updateBottle } from '../lib/storage';
  import { calculateQuantity, findDuplicate } from '../lib/bottle-utils';
  import { attemptSync } from '../lib/sync-manager';
  import { toastSuccess, toastError } from '../lib/toast.svelte';
  import {
    createBottleFromForm,
    createEmptyFormData,
    createHistoryEntryFromForm,
    validateForm,
    type FormData,
    type FormErrors,
  } from '../lib/form-utils';
  import { getUniqueCountries, getUniqueRegions } from '../lib/search-utils';
  import FormField from './FormField.svelte';
  import GrapeTagInput from './GrapeTagInput.svelte';
  import NameAutocomplete from './NameAutocomplete.svelte';
  import TextAutocomplete from './TextAutocomplete.svelte';

  let form = $state<FormData>(createEmptyFormData());
  let errors = $state<FormErrors>({});
  let allBottles = $state<Bottle[]>([]);
  let selectedBottle = $state<Bottle | null>(null);

  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red', [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé', [WineType.Sparkling]: 'Sparkling',
  };

  // Load bottles on mount for autocomplete
  getAllBottles().then((bottles) => { allBottles = bottles; });

  /** Update a single form field immutably. */
  function set(field: keyof FormData, value: string): void {
    form = { ...form, [field]: value };
  }

  /** Update a key field and re-run duplicate detection. */
  function setKeyField(field: 'name' | 'vintage' | 'type', value: string): void {
    form = { ...form, [field]: value };
    redetectDuplicate({ ...form, [field]: value });
  }

  /** Auto-fill form fields from a selected bottle. */
  function fillFormFromBottle(bottle: Bottle): void {
    form = {
      ...form,
      name: bottle.name,
      vintage: String(bottle.vintage),
      type: bottle.type,
      country: bottle.country,
      region: bottle.region,
      grapeVariety: bottle.grapeVariety,
      location: bottle.location ?? '',
      rating: bottle.rating ? String(bottle.rating) : '',
      notes: bottle.notes ?? '',
    };
  }

  /** Handle autocomplete selection. */
  function handleAutocompleteSelect(bottle: Bottle): void {
    selectedBottle = bottle;
    fillFormFromBottle(bottle);
  }

  /** Clear the existing bottle selection. */
  function clearSelection(): void {
    selectedBottle = null;
  }

  /** Re-run duplicate detection when key fields change. */
  function redetectDuplicate(currentForm: FormData): void {
    const type = currentForm.type as WineType;
    const vintage = Number(currentForm.vintage);
    const name = currentForm.name;

    if (!name || !vintage || !type) {
      selectedBottle = null;
      return;
    }

    const match = findDuplicate(allBottles, type, vintage, name);
    if (match && match.id !== selectedBottle?.id) {
      selectedBottle = match;
      fillFormFromBottle(match);
    } else if (!match) {
      selectedBottle = null;
    }
  }

  async function handleSubmit(): Promise<void> {
    errors = validateForm(form);
    if (Object.keys(errors).length > 0) return;

    try {
      if (selectedBottle) {
        const entry = createHistoryEntryFromForm(form);
        await updateBottle({ ...selectedBottle, grapeVariety: [...selectedBottle.grapeVariety], history: [...selectedBottle.history, entry] });
        attemptSync(`Updated bottle: ${selectedBottle.name} ${selectedBottle.vintage}`);
        toastSuccess(`Updated ${selectedBottle.name} ${selectedBottle.vintage}`);
        navigate('/');
        return;
      }

      const bottle = createBottleFromForm(form);
      await addBottle(bottle);
      attemptSync(`Added bottle: ${form.name} ${form.vintage}`);
      toastSuccess(`Added ${form.name} ${form.vintage}`);
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save bottle';
      toastError(message);
    }
  }
</script>

<div class="p-4">
  <h2 class="text-2xl font-bold">Add Bottle</h2>

  {#if selectedBottle}
    <div class="mt-4 rounded-lg border border-blue-300 bg-blue-50 p-4" data-testid="existing-bottle-banner">
      <p class="font-semibold text-blue-800">Existing bottle selected</p>
      <p class="mt-1 text-sm text-blue-700">{selectedBottle.name} ({selectedBottle.vintage}, {typeLabels[selectedBottle.type]}) — {calculateQuantity(selectedBottle.history)} in stock</p>
      <button type="button" class="mt-2 rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200" data-testid="clear-selection" onclick={clearSelection}>Clear selection</button>
    </div>
  {/if}

  <form class="mt-4 space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} data-testid="add-bottle-form">
    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Wine Details</legend>
      <NameAutocomplete
        value={form.name}
        bottles={allBottles}
        oninput={(v) => setKeyField('name', v)}
        onselect={handleAutocompleteSelect}
        error={errors.name}
      />
      <div class="grid grid-cols-2 gap-3">
        <FormField label="Vintage *" id="vintage" error={errors.vintage} errorTestId="error-vintage">
          <input id="vintage" type="number" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.vintage} oninput={(e) => setKeyField('vintage', e.currentTarget.value)} data-testid="input-vintage" />
        </FormField>
        <FormField label="Type *" id="type" error={errors.type} errorTestId="error-type">
          <select id="type" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.type} onchange={(e) => setKeyField('type', e.currentTarget.value)} data-testid="input-type">
            <option value="">Select...</option>
            {#each Object.values(WineType) as wt (wt)}<option value={wt}>{typeLabels[wt]}</option>{/each}
          </select>
        </FormField>
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Origin</legend>
      <div class="grid grid-cols-2 gap-3">
        <TextAutocomplete
          value={form.country}
          suggestions={getUniqueCountries(allBottles)}
          oninput={(v) => set('country', v)}
          label="Country *"
          id="country"
          error={errors.country}
          errorTestId="error-country"
          disabled={!!selectedBottle}
        />
        <TextAutocomplete
          value={form.region}
          suggestions={getUniqueRegions(allBottles)}
          oninput={(v) => set('region', v)}
          label="Region"
          id="region"
          error={errors.region}
          errorTestId="error-region"
          disabled={!!selectedBottle}
        />
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Characteristics</legend>
      <GrapeTagInput tags={form.grapeVariety} onchange={(tags) => { form = { ...form, grapeVariety: tags }; }} disabled={!!selectedBottle} />
      <FormField label="Rating (1-10)" id="rating" error={errors.rating} errorTestId="error-rating">
        <input id="rating" type="number" min="1" max="10" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" readonly={!!selectedBottle} value={form.rating} oninput={(e) => set('rating', e.currentTarget.value)} data-testid="input-rating" />
      </FormField>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Storage</legend>
      <FormField label="Location" id="location">
        <input id="location" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" readonly={!!selectedBottle} value={form.location} oninput={(e) => set('location', e.currentTarget.value)} data-testid="input-location" />
      </FormField>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Purchase</legend>
      <FormField label="Quantity *" id="quantity" error={errors.quantity} errorTestId="error-quantity">
        <input id="quantity" type="number" min="1" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.quantity} oninput={(e) => set('quantity', e.currentTarget.value)} data-testid="input-quantity" />
      </FormField>
      <div class="grid grid-cols-3 gap-3">
        <div class="col-span-2">
          <FormField label="Price" id="price" error={errors.priceAmount} errorTestId="error-price">
            <input id="price" type="number" step="0.01" min="0" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.priceAmount} oninput={(e) => set('priceAmount', e.currentTarget.value)} data-testid="input-price" />
          </FormField>
        </div>
        <FormField label="Currency" id="currency">
          <input id="currency" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.priceCurrency} oninput={(e) => set('priceCurrency', e.currentTarget.value)} data-testid="input-currency" />
        </FormField>
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Notes</legend>
      <FormField label="Bottle Notes" id="notes">
        <textarea id="notes" rows="2" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" readonly={!!selectedBottle} value={form.notes} oninput={(e) => set('notes', e.currentTarget.value)} data-testid="input-notes"></textarea>
      </FormField>
      <FormField label="Purchase Notes" id="history-notes">
        <textarea id="history-notes" rows="2" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.historyNotes} oninput={(e) => set('historyNotes', e.currentTarget.value)} data-testid="input-history-notes"></textarea>
      </FormField>
    </fieldset>

    <button type="submit" class="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700" data-testid="submit-button">Add Bottle</button>
  </form>
</div>
