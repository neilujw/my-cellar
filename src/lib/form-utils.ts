import {
  DEFAULT_CURRENCY,
  HistoryAction,
  WineType,
  type Bottle,
  type HistoryEntry,
  type Price,
} from './types';

/** Form field values — all strings for input binding. */
export interface FormData {
  readonly name: string;
  readonly vintage: string;
  readonly type: string;
  readonly country: string;
  readonly region: string;
  readonly grapeVariety: readonly string[];
  readonly location: string;
  readonly rating: string;
  readonly notes: string;
  readonly consumeStartingFrom: string;
  readonly quantity: string;
  readonly priceAmount: string;
  readonly priceCurrency: string;
  readonly historyNotes: string;
}

/** Mapping of field names to validation error messages. */
export type FormErrors = Partial<Record<keyof FormData, string>>;

/** Returns empty FormData with sensible defaults. */
export function createEmptyFormData(): FormData {
  return {
    name: '',
    vintage: '',
    type: '',
    country: '',
    region: '',
    grapeVariety: [],
    location: '',
    rating: '',
    notes: '',
    consumeStartingFrom: '',
    quantity: '1',
    priceAmount: '',
    priceCurrency: DEFAULT_CURRENCY,
    historyNotes: '',
  };
}

const MIN_VINTAGE = 1900;
const MAX_VINTAGE = 2099;
const MIN_RATING = 1;
const MAX_RATING = 10;

/**
 * Validates form data and returns field-to-error-message map.
 * Returns an empty object when all fields are valid.
 */
export function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  const vintage = Number(data.vintage);
  if (!data.vintage.trim() || !Number.isInteger(vintage) || vintage < MIN_VINTAGE || vintage > MAX_VINTAGE) {
    errors.vintage = 'Vintage must be a year between 1900 and 2099';
  }

  if (!data.type || !Object.values(WineType).includes(data.type as WineType)) {
    errors.type = 'Wine type is required';
  }

  if (!data.country.trim()) {
    errors.country = 'Country is required';
  }

  const quantity = Number(data.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    errors.quantity = 'Quantity must be at least 1';
  }

  if (data.rating.trim()) {
    const rating = Number(data.rating);
    if (isNaN(rating) || rating < MIN_RATING || rating > MAX_RATING) {
      errors.rating = 'Rating must be between 1 and 10';
    }
  }

  if (data.consumeStartingFrom.trim()) {
    const consumeYear = Number(data.consumeStartingFrom);
    if (!Number.isInteger(consumeYear)) {
      errors.consumeStartingFrom = 'Drink from must be a valid year';
    } else if (!errors.vintage && data.vintage.trim() && consumeYear < vintage) {
      errors.consumeStartingFrom = 'Drink from must not be earlier than vintage';
    }
  }

  if (data.priceAmount.trim()) {
    const price = Number(data.priceAmount);
    if (isNaN(price) || price <= 0) {
      errors.priceAmount = 'Price must be greater than 0';
    }
  }

  return errors;
}

/**
 * Converts validated form data into a Bottle with a generated UUID
 * and an initial "added" history entry.
 */
export function createBottleFromForm(data: FormData): Bottle {
  const historyEntry = createHistoryEntryFromForm(data);

  return {
    id: crypto.randomUUID(),
    name: data.name.trim(),
    vintage: Number(data.vintage),
    type: data.type as WineType,
    country: data.country.trim(),
    ...(data.region.trim() && { region: data.region.trim() }),
    grapeVariety: [...data.grapeVariety],
    ...(data.location.trim() && { location: data.location.trim() }),
    ...(data.rating.trim() && { rating: Number(data.rating) }),
    ...(data.notes.trim() && { notes: data.notes.trim() }),
    ...(data.consumeStartingFrom.trim() && { consumeStartingFrom: Number(data.consumeStartingFrom) }),
    history: [historyEntry],
  };
}

/**
 * Creates an "added" history entry from form data.
 * Used both for new bottles and for merging into existing duplicates.
 */
export function createHistoryEntryFromForm(data: FormData): HistoryEntry {
  let price: Price | undefined;
  if (data.priceAmount.trim()) {
    price = {
      amount: Number(data.priceAmount),
      currency: data.priceCurrency || DEFAULT_CURRENCY,
    };
  }

  return {
    date: new Date().toISOString().split('T')[0],
    action: HistoryAction.Added,
    quantity: Number(data.quantity),
    ...(price && { price }),
    ...(data.historyNotes.trim() && { notes: data.historyNotes.trim() }),
  };
}
