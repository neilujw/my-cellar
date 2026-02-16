import { WineType, HistoryAction } from './types';
import type { Bottle, HistoryEntry, Price } from './types';

/**
 * Generates the GitHub repository file path for a bottle.
 * Format: `wines/{type}/wine-{uuid}.json`
 */
export function bottleToFilePath(bottle: Bottle): string {
  return `wines/${bottle.type}/wine-${bottle.id}.json`;
}

/**
 * Canonical key ordering for bottle JSON serialization.
 * Matches the PROJECT.md schema for diff-friendly output.
 */
const BOTTLE_KEY_ORDER: ReadonlyArray<keyof Bottle> = [
  'id',
  'name',
  'vintage',
  'type',
  'country',
  'region',
  'grapeVariety',
  'location',
  'rating',
  'notes',
  'history',
];

/** Canonical key ordering for history entry serialization. */
const HISTORY_ENTRY_KEY_ORDER: ReadonlyArray<keyof HistoryEntry> = [
  'date',
  'action',
  'quantity',
  'price',
  'notes',
];

/** Canonical key ordering for price serialization. */
const PRICE_KEY_ORDER: ReadonlyArray<keyof Price> = ['amount', 'currency'];

/**
 * Orders an object's keys according to a specified ordering.
 * Keys not in the ordering are omitted; undefined values are omitted.
 */
function orderKeys<T extends Record<string, unknown>>(
  obj: T,
  keyOrder: ReadonlyArray<keyof T>,
): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    if (obj[key] !== undefined) {
      ordered[key as string] = obj[key];
    }
  }
  return ordered;
}

/**
 * Serializes a Bottle to a pretty-printed JSON string with consistent key ordering.
 * Output uses 2-space indentation and a trailing newline for diff-friendliness.
 */
export function serializeBottle(bottle: Bottle): string {
  const ordered = orderKeys(bottle, BOTTLE_KEY_ORDER);

  // Order history entries and their nested price objects
  if (Array.isArray(ordered.history)) {
    ordered.history = (ordered.history as HistoryEntry[]).map((entry) => {
      const orderedEntry = orderKeys(entry, HISTORY_ENTRY_KEY_ORDER);
      if (orderedEntry.price) {
        orderedEntry.price = orderKeys(orderedEntry.price as Price, PRICE_KEY_ORDER);
      }
      return orderedEntry;
    });
  }

  return JSON.stringify(ordered, null, 2) + '\n';
}

/** Valid wine type values for deserialization validation. */
const VALID_WINE_TYPES = new Set<string>(Object.values(WineType));

/** Valid history action values for deserialization validation. */
const VALID_HISTORY_ACTIONS = new Set<string>(Object.values(HistoryAction));

/**
 * Deserializes a JSON string into a validated Bottle object.
 * Throws an error with a descriptive message if the JSON is invalid
 * or does not conform to the Bottle schema.
 */
export function deserializeBottle(json: string): Bottle {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON');
  }
  const error = validateBottleData(data);
  if (error) {
    throw new Error(error);
  }
  return data as Bottle;
}

/**
 * Validates unknown data against the Bottle schema.
 * Returns an error message string if invalid, or null if valid.
 */
function validateBottleData(data: unknown): string | null {
  if (typeof data !== 'object' || data === null) return 'Expected an object';

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id === '') return 'Missing or invalid "id"';
  if (typeof obj.name !== 'string' || obj.name === '') return 'Missing or invalid "name"';
  if (typeof obj.vintage !== 'number' || !Number.isInteger(obj.vintage)) return 'Missing or invalid "vintage"';
  if (typeof obj.type !== 'string' || !VALID_WINE_TYPES.has(obj.type)) return `Invalid wine type: "${String(obj.type)}"`;
  if (typeof obj.country !== 'string') return 'Missing or invalid "country"';
  if (obj.region !== undefined && typeof obj.region !== 'string') return 'Invalid "region": expected string';

  if (!Array.isArray(obj.grapeVariety)) return 'Missing or invalid "grapeVariety"';
  if (!obj.grapeVariety.every((g: unknown) => typeof g === 'string')) return '"grapeVariety" must contain only strings';

  if (obj.location !== undefined && typeof obj.location !== 'string') return 'Invalid "location": expected string';
  if (obj.rating !== undefined && typeof obj.rating !== 'number') return 'Invalid "rating": expected number';
  if (obj.notes !== undefined && typeof obj.notes !== 'string') return 'Invalid "notes": expected string';

  if (!Array.isArray(obj.history)) return 'Missing or invalid "history"';
  for (let i = 0; i < obj.history.length; i++) {
    const entryError = validateHistoryEntry(obj.history[i]);
    if (entryError) return `history[${i}]: ${entryError}`;
  }

  return null;
}

/** Validates a single history entry. Returns an error message or null. */
function validateHistoryEntry(entry: unknown): string | null {
  if (typeof entry !== 'object' || entry === null) return 'Expected an object';

  const obj = entry as Record<string, unknown>;

  if (typeof obj.date !== 'string') return 'Missing or invalid "date"';
  if (typeof obj.action !== 'string' || !VALID_HISTORY_ACTIONS.has(obj.action)) return `Invalid action: "${String(obj.action)}"`;
  if (typeof obj.quantity !== 'number' || !Number.isInteger(obj.quantity)) return 'Missing or invalid "quantity"';

  if (obj.price !== undefined) {
    if (typeof obj.price !== 'object' || obj.price === null) return 'Invalid "price": expected object';
    const price = obj.price as Record<string, unknown>;
    if (typeof price.amount !== 'number') return 'Invalid "price.amount": expected number';
    if (typeof price.currency !== 'string') return 'Invalid "price.currency": expected string';
  }

  if (obj.notes !== undefined && typeof obj.notes !== 'string') return 'Invalid "notes": expected string';

  return null;
}
