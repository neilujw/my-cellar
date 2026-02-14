<script lang="ts">
  /**
   * Add Bottle view — form to add new bottles or update quantity.
   * Delegates validation and bottle creation to form-utils.ts.
   */
  import { WineType, type Bottle } from '../lib/types';
  import { navigate } from '../lib/router.svelte.ts';
  import { addBottle, getAllBottles, updateBottle } from '../lib/storage';
  import { findDuplicate } from '../lib/bottle-utils';
  import {
    createBottleFromForm,
    createEmptyFormData,
    createHistoryEntryFromForm,
    validateForm,
    type FormData,
    type FormErrors,
  } from '../lib/form-utils';
  import FormField from './FormField.svelte';
  import GrapeTagInput from './GrapeTagInput.svelte';

  let form = $state<FormData>(createEmptyFormData());
  let errors = $state<FormErrors>({});
  let duplicate = $state<Bottle | null>(null);

  const typeLabels: Record<WineType, string> = {
    [WineType.Red]: 'Red', [WineType.White]: 'White',
    [WineType.Rose]: 'Rosé', [WineType.Sparkling]: 'Sparkling',
  };

  /** Update a single form field immutably. */
  function set(field: keyof FormData, value: string): void {
    form = { ...form, [field]: value };
  }

  async function handleSubmit(): Promise<void> {
    errors = validateForm(form);
    if (Object.keys(errors).length > 0) return;

    const bottles = await getAllBottles();
    const match = findDuplicate(bottles, form.type as WineType, Number(form.vintage), form.name);
    if (match) { duplicate = match; return; }

    await addBottle(createBottleFromForm(form));
    navigate('/');
  }

  async function confirmDuplicate(): Promise<void> {
    if (!duplicate) return;
    const entry = createHistoryEntryFromForm(form);
    await updateBottle({ ...duplicate, history: [...duplicate.history, entry] });
    navigate('/');
  }
</script>

<div class="p-4">
  <h2 class="text-2xl font-bold">Add Bottle</h2>

  {#if duplicate}
    <div class="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4" data-testid="duplicate-banner">
      <p class="font-semibold text-amber-800">Duplicate found</p>
      <p class="mt-1 text-sm text-amber-700">{duplicate.name} ({duplicate.vintage}) already exists. Add quantity to existing bottle?</p>
      <div class="mt-3 flex gap-2">
        <button class="rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700" data-testid="confirm-duplicate" onclick={confirmDuplicate}>Confirm</button>
        <button class="rounded bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300" data-testid="cancel-duplicate" onclick={() => { duplicate = null; }}>Cancel</button>
      </div>
    </div>
  {/if}

  <form class="mt-4 space-y-4" onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} data-testid="add-bottle-form">
    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Wine Details</legend>
      <FormField label="Name *" id="name" error={errors.name} errorTestId="error-name">
        <input id="name" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.name} oninput={(e) => set('name', e.currentTarget.value)} data-testid="input-name" />
      </FormField>
      <div class="grid grid-cols-2 gap-3">
        <FormField label="Vintage *" id="vintage" error={errors.vintage} errorTestId="error-vintage">
          <input id="vintage" type="number" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.vintage} oninput={(e) => set('vintage', e.currentTarget.value)} data-testid="input-vintage" />
        </FormField>
        <FormField label="Type *" id="type" error={errors.type} errorTestId="error-type">
          <select id="type" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.type} onchange={(e) => set('type', e.currentTarget.value)} data-testid="input-type">
            <option value="">Select...</option>
            {#each Object.values(WineType) as wt (wt)}<option value={wt}>{typeLabels[wt]}</option>{/each}
          </select>
        </FormField>
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Origin</legend>
      <div class="grid grid-cols-2 gap-3">
        <FormField label="Country *" id="country" error={errors.country} errorTestId="error-country">
          <input id="country" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.country} oninput={(e) => set('country', e.currentTarget.value)} data-testid="input-country" />
        </FormField>
        <FormField label="Region *" id="region" error={errors.region} errorTestId="error-region">
          <input id="region" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.region} oninput={(e) => set('region', e.currentTarget.value)} data-testid="input-region" />
        </FormField>
      </div>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Characteristics</legend>
      <GrapeTagInput tags={form.grapeVariety} onchange={(tags) => { form = { ...form, grapeVariety: tags }; }} />
      <FormField label="Rating (1-10)" id="rating" error={errors.rating} errorTestId="error-rating">
        <input id="rating" type="number" min="1" max="10" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.rating} oninput={(e) => set('rating', e.currentTarget.value)} data-testid="input-rating" />
      </FormField>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="text-sm font-semibold text-gray-700">Storage</legend>
      <FormField label="Location" id="location">
        <input id="location" type="text" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.location} oninput={(e) => set('location', e.currentTarget.value)} data-testid="input-location" />
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
        <textarea id="notes" rows="2" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.notes} oninput={(e) => set('notes', e.currentTarget.value)} data-testid="input-notes"></textarea>
      </FormField>
      <FormField label="Purchase Notes" id="history-notes">
        <textarea id="history-notes" rows="2" class="mt-1 block w-full rounded border border-gray-300 px-3 py-2" value={form.historyNotes} oninput={(e) => set('historyNotes', e.currentTarget.value)} data-testid="input-history-notes"></textarea>
      </FormField>
    </fieldset>

    <button type="submit" class="w-full rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700" data-testid="submit-button">Add Bottle</button>
  </form>
</div>
