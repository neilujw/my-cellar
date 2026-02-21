import {
  HistoryAction,
  type Bottle,
  type HistoryEntry,
  type WineType,
} from "./types";
import { accentInsensitiveEquals } from "./text-utils";

/**
 * Calculates the current quantity of a bottle from its history.
 *
 * Sums all "added" quantities and subtracts "consumed" and "removed" quantities.
 * The result is clamped to a minimum of 0.
 */
export function calculateQuantity(history: readonly HistoryEntry[]): number {
  const total = history.reduce((sum, entry) => {
    if (entry.action === HistoryAction.Added) {
      return sum + entry.quantity;
    }
    return sum - entry.quantity;
  }, 0);

  return Math.max(0, total);
}

/** Formats a vintage for display: returns "N/A" for no-vintage bottles (0), year string otherwise. */
export function formatVintage(vintage: number): string {
  return vintage === 0 ? "N/A" : String(vintage);
}

const MIN_SEARCH_LENGTH = 2;

/**
 * Searches bottles by name using case-insensitive "contains" matching.
 *
 * Returns matching bottles sorted alphabetically by name.
 * Returns an empty array if the query is fewer than 2 characters.
 */
export function searchBottlesByName(
  bottles: readonly Bottle[],
  query: string,
): Bottle[] {
  if (query.length < MIN_SEARCH_LENGTH) return [];

  const normalizedQuery = query.toLowerCase();

  return bottles
    .filter((bottle) => bottle.name.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Creates a "consumed" history entry with quantity 1 and today's date.
 */
export function createConsumeHistoryEntry(): HistoryEntry {
  return {
    date: new Date().toISOString().split("T")[0],
    action: HistoryAction.Consumed,
    quantity: 1,
  };
}

/**
 * Creates a "removed" history entry with quantity 1 and today's date.
 */
export function createRemoveHistoryEntry(): HistoryEntry {
  return {
    date: new Date().toISOString().split("T")[0],
    action: HistoryAction.Removed,
    quantity: 1,
  };
}

/**
 * Returns a new Bottle with the given history entry appended.
 */
export function applyHistoryEntry(bottle: Bottle, entry: HistoryEntry): Bottle {
  return {
    ...bottle,
    history: [...bottle.history, entry],
  };
}

/**
 * Finds a duplicate bottle matching the given type, vintage, and name.
 *
 * Matching rules:
 * - `type`: exact match
 * - `vintage`: exact match
 * - `name`: case-insensitive match
 *
 * @returns The first matching bottle, or `undefined` if no duplicate exists.
 */
export function findDuplicate(
  bottles: readonly Bottle[],
  type: WineType,
  vintage: number,
  name: string,
): Bottle | undefined {
  return bottles.find(
    (bottle) =>
      bottle.type === type &&
      bottle.vintage === vintage &&
      accentInsensitiveEquals(bottle.name, name),
  );
}
