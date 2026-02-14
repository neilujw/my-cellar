import { HistoryAction, type Bottle, type HistoryEntry, type WineType } from './types';

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
  const normalizedName = name.toLowerCase();

  return bottles.find(
    (bottle) =>
      bottle.type === type &&
      bottle.vintage === vintage &&
      bottle.name.toLowerCase() === normalizedName,
  );
}
