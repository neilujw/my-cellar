import { type Bottle, type WineType } from "./types";
import { calculateQuantity } from "./bottle-utils";
import {
  accentInsensitiveIncludes,
  accentInsensitiveEquals,
} from "./text-utils";

/** Active search filters. Empty/undefined values mean "no filter". */
export interface SearchFilters {
  readonly searchText: string;
  readonly types: readonly WineType[];
  readonly country: string;
  readonly region: string;
  readonly vintageMin: number | undefined;
  readonly vintageMax: number | undefined;
  readonly minRating: number | undefined;
  readonly readyToDrink: boolean;
}

/** Available sort options for bottle results. */
export type SortOption =
  | "name"
  | "vintage"
  | "rating"
  | "quantity"
  | "recentlyAdded";

/** Returns a SearchFilters with all filters cleared. */
export function createEmptyFilters(): SearchFilters {
  return {
    searchText: "",
    types: [],
    country: "",
    region: "",
    vintageMin: undefined,
    vintageMax: undefined,
    minRating: undefined,
    readyToDrink: false,
  };
}

/**
 * Counts how many filters are actively set.
 * Search text is excluded from the count (it has its own input).
 */
export function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.types.length > 0) count++;
  if (filters.country !== "") count++;
  if (filters.region !== "") count++;
  if (filters.vintageMin !== undefined) count++;
  if (filters.vintageMax !== undefined) count++;
  if (filters.minRating !== undefined) count++;
  if (filters.readyToDrink) count++;
  return count;
}

/**
 * Filters bottles by applying all active filters with AND logic.
 * Empty/undefined filter values are skipped (no filtering on that criterion).
 */
export function filterBottles(
  bottles: readonly Bottle[],
  filters: SearchFilters,
): Bottle[] {
  return bottles.filter((bottle) => {
    // Text search: case- and accent-insensitive partial match on name
    if (
      filters.searchText !== "" &&
      !accentInsensitiveIncludes(bottle.name, filters.searchText)
    ) {
      return false;
    }

    // Type filter: bottle must match one of the selected types
    if (filters.types.length > 0 && !filters.types.includes(bottle.type)) {
      return false;
    }

    // Country filter: accent-insensitive match
    if (
      filters.country !== "" &&
      !accentInsensitiveEquals(bottle.country, filters.country)
    ) {
      return false;
    }

    // Region filter: accent-insensitive match
    if (
      filters.region !== "" &&
      (!bottle.region ||
        !accentInsensitiveEquals(bottle.region, filters.region))
    ) {
      return false;
    }

    // Vintage range filter: no-vintage bottles (0) are excluded when a range is active
    if (filters.vintageMin !== undefined || filters.vintageMax !== undefined) {
      if (bottle.vintage === 0) return false;
      if (
        filters.vintageMin !== undefined &&
        bottle.vintage < filters.vintageMin
      )
        return false;
      if (
        filters.vintageMax !== undefined &&
        bottle.vintage > filters.vintageMax
      )
        return false;
    }

    // Minimum rating filter: unrated bottles are excluded
    if (filters.minRating !== undefined) {
      if (bottle.rating === undefined || bottle.rating < filters.minRating) {
        return false;
      }
    }

    // Ready to drink filter: consumeStartingFrom <= current year and quantity > 0
    if (filters.readyToDrink) {
      const currentYear = new Date().getFullYear();
      if (
        bottle.consumeStartingFrom === undefined ||
        bottle.consumeStartingFrom > currentYear ||
        calculateQuantity(bottle.history) <= 0
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sorts bottles by the selected option.
 * - name: alphabetical ascending
 * - vintage: ascending
 * - rating: descending (unrated bottles last)
 * - quantity: descending
 * - recentlyAdded: most recent history entry first
 */
export function sortBottles(
  bottles: readonly Bottle[],
  sortOption: SortOption,
): Bottle[] {
  const sorted = [...bottles];

  switch (sortOption) {
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "vintage":
      sorted.sort((a, b) => {
        // No-vintage bottles (0) go last
        if (a.vintage === 0 && b.vintage === 0) return 0;
        if (a.vintage === 0) return 1;
        if (b.vintage === 0) return -1;
        return a.vintage - b.vintage;
      });
      break;
    case "rating":
      sorted.sort((a, b) => {
        // Unrated bottles go last
        if (a.rating === undefined && b.rating === undefined) return 0;
        if (a.rating === undefined) return 1;
        if (b.rating === undefined) return -1;
        return b.rating - a.rating;
      });
      break;
    case "quantity":
      sorted.sort(
        (a, b) => calculateQuantity(b.history) - calculateQuantity(a.history),
      );
      break;
    case "recentlyAdded": {
      sorted.sort((a, b) => {
        const aLatest = getMostRecentDate(a);
        const bLatest = getMostRecentDate(b);
        return bLatest.localeCompare(aLatest);
      });
      break;
    }
  }

  return sorted;
}

/** Returns the most recent history entry date, or empty string if no history. */
function getMostRecentDate(bottle: Bottle): string {
  if (bottle.history.length === 0) return "";
  return bottle.history.reduce(
    (latest, entry) => (entry.date > latest ? entry.date : latest),
    "",
  );
}

/** Extracts sorted unique country values from all bottles. */
export function getUniqueCountries(bottles: readonly Bottle[]): string[] {
  const countries = new Set(bottles.map((b) => b.country));
  return Array.from(countries).sort((a, b) => a.localeCompare(b));
}

/** Parses a numeric input value, returning undefined for empty/invalid strings. */
export function parseOptionalNumber(value: string): number | undefined {
  if (value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

/** Extracts sorted unique region values from all bottles. */
export function getUniqueRegions(bottles: readonly Bottle[]): string[] {
  const regions = new Set(
    bottles.map((b) => b.region).filter((r): r is string => r !== undefined),
  );
  return Array.from(regions).sort((a, b) => a.localeCompare(b));
}
