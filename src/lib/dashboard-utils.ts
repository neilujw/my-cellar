import { WineType, type Bottle, type HistoryAction } from './types';
import { calculateQuantity } from './bottle-utils';

/** A wine type breakdown entry with its bottle count. */
export interface TypeStat {
  readonly type: WineType;
  readonly count: number;
}

/** A region ranking entry with its bottle count. */
export interface RegionStat {
  readonly region: string;
  readonly count: number;
}

/** A recent activity entry enriched with bottle metadata. */
export interface ActivityEntry {
  readonly date: string;
  readonly action: HistoryAction;
  readonly quantity: number;
  readonly bottleName: string;
  readonly vintage: number;
}

/**
 * Returns the total bottle count across all bottles.
 * Sums current quantities (derived from history) for each bottle.
 */
export function getTotalBottleCount(bottles: readonly Bottle[]): number {
  return bottles.reduce((sum, bottle) => sum + calculateQuantity(bottle.history), 0);
}

/**
 * Returns bottle count breakdown by wine type.
 * All wine types are included, even those with 0 bottles.
 */
export function getStatsByType(bottles: readonly Bottle[]): Record<WineType, number> {
  const stats: Record<WineType, number> = {
    [WineType.Red]: 0,
    [WineType.White]: 0,
    [WineType.Rose]: 0,
    [WineType.Sparkling]: 0,
  };

  for (const bottle of bottles) {
    stats[bottle.type] += calculateQuantity(bottle.history);
  }

  return stats;
}

/**
 * Returns the top N regions by total bottle quantity, sorted descending.
 * Only includes regions with at least 1 bottle in stock.
 */
export function getTopRegions(bottles: readonly Bottle[], limit: number): RegionStat[] {
  const regionMap = new Map<string, number>();

  for (const bottle of bottles) {
    const quantity = calculateQuantity(bottle.history);
    if (quantity > 0) {
      const key = bottle.region ?? 'N/A';
      const current = regionMap.get(key) ?? 0;
      regionMap.set(key, current + quantity);
    }
  }

  return Array.from(regionMap.entries())
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Returns the N most recent history entries across all bottles.
 * Each entry is enriched with the bottle's name and vintage.
 * Sorted by date descending (most recent first).
 */
export function getRecentActivity(bottles: readonly Bottle[], limit: number): ActivityEntry[] {
  const entries: ActivityEntry[] = [];

  for (const bottle of bottles) {
    for (const entry of bottle.history) {
      entries.push({
        date: entry.date,
        action: entry.action,
        quantity: entry.quantity,
        bottleName: bottle.name,
        vintage: bottle.vintage,
      });
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

/**
 * Returns the N most recently active bottles, sorted by latest history date descending.
 * Only includes bottles with at least one bottle in stock.
 */
export function getRecentBottles(bottles: readonly Bottle[], limit: number): Bottle[] {
  return [...bottles]
    .filter((b) => b.history.length > 0 && calculateQuantity(b.history) > 0)
    .sort((a, b) => {
      const aLatest = a.history.reduce((max, e) => (e.date > max ? e.date : max), '');
      const bLatest = b.history.reduce((max, e) => (e.date > max ? e.date : max), '');
      return bLatest.localeCompare(aLatest);
    })
    .slice(0, limit);
}

/**
 * Formats a history action for display.
 * Capitalizes the first letter (e.g., "added" -> "Added").
 */
export function formatAction(action: HistoryAction): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
