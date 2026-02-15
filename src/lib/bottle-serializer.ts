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
 * Returns `null` if the JSON is invalid or does not conform to the Bottle schema.
 */
export function deserializeBottle(json: string): Bottle | null {
  try {
    const data: unknown = JSON.parse(json);
    if (!isValidBottle(data)) return null;
    return data;
  } catch {
    return null;
  }
}

/** Type guard that validates an unknown value conforms to the Bottle interface. */
function isValidBottle(data: unknown): data is Bottle {
  if (typeof data !== 'object' || data === null) return false;

  const obj = data as Record<string, unknown>;

  if (typeof obj.id !== 'string' || obj.id === '') return false;
  if (typeof obj.name !== 'string' || obj.name === '') return false;
  if (typeof obj.vintage !== 'number' || !Number.isInteger(obj.vintage)) return false;
  if (typeof obj.type !== 'string' || !VALID_WINE_TYPES.has(obj.type)) return false;
  if (typeof obj.country !== 'string') return false;
  if (typeof obj.region !== 'string') return false;

  if (!Array.isArray(obj.grapeVariety)) return false;
  if (!obj.grapeVariety.every((g: unknown) => typeof g === 'string')) return false;

  if (obj.location !== undefined && typeof obj.location !== 'string') return false;
  if (obj.rating !== undefined && typeof obj.rating !== 'number') return false;
  if (obj.notes !== undefined && typeof obj.notes !== 'string') return false;

  if (!Array.isArray(obj.history)) return false;
  if (!obj.history.every(isValidHistoryEntry)) return false;

  return true;
}

/** Validates a single history entry. */
function isValidHistoryEntry(entry: unknown): entry is HistoryEntry {
  if (typeof entry !== 'object' || entry === null) return false;

  const obj = entry as Record<string, unknown>;

  if (typeof obj.date !== 'string') return false;
  if (typeof obj.action !== 'string' || !VALID_HISTORY_ACTIONS.has(obj.action)) return false;
  if (typeof obj.quantity !== 'number' || !Number.isInteger(obj.quantity)) return false;

  if (obj.price !== undefined) {
    if (typeof obj.price !== 'object' || obj.price === null) return false;
    const price = obj.price as Record<string, unknown>;
    if (typeof price.amount !== 'number') return false;
    if (typeof price.currency !== 'string') return false;
  }

  if (obj.notes !== undefined && typeof obj.notes !== 'string') return false;

  return true;
}
