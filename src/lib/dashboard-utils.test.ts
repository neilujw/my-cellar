import { describe, it, expect } from 'vitest';

import {
  formatAction,
  getRecentActivity,
  getStatsByType,
  getTotalBottleCount,
  getTopRegions,
} from './dashboard-utils';
import { HistoryAction, WineType, type Bottle, type HistoryEntry } from './types';

function makeEntry(
  action: HistoryAction,
  quantity: number,
  date: string = '2026-01-01',
): HistoryEntry {
  return { date, action, quantity };
}

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'test-id',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [makeEntry(HistoryAction.Added, 3)],
    ...overrides,
  };
}

describe('getTotalBottleCount', () => {
  it('should return 0 when bottles array is empty', () => {
    expect(getTotalBottleCount([])).toBe(0);
  });

  it('should return correct count for a single bottle', () => {
    const bottles = [makeBottle()];

    expect(getTotalBottleCount(bottles)).toBe(3);
  });

  it('should sum quantities across multiple bottles', () => {
    const bottles = [
      makeBottle({ id: 'a', history: [makeEntry(HistoryAction.Added, 3)] }),
      makeBottle({ id: 'b', history: [makeEntry(HistoryAction.Added, 5)] }),
    ];

    expect(getTotalBottleCount(bottles)).toBe(8);
  });

  it('should account for consumed and removed bottles', () => {
    const bottles = [
      makeBottle({
        history: [
          makeEntry(HistoryAction.Added, 5),
          makeEntry(HistoryAction.Consumed, 2),
          makeEntry(HistoryAction.Removed, 1),
        ],
      }),
    ];

    expect(getTotalBottleCount(bottles)).toBe(2);
  });

  it('should not count bottles with 0 quantity', () => {
    const bottles = [
      makeBottle({
        id: 'a',
        history: [makeEntry(HistoryAction.Added, 2), makeEntry(HistoryAction.Consumed, 2)],
      }),
      makeBottle({ id: 'b', history: [makeEntry(HistoryAction.Added, 1)] }),
    ];

    expect(getTotalBottleCount(bottles)).toBe(1);
  });
});

describe('getStatsByType', () => {
  it('should return all types with 0 when bottles array is empty', () => {
    const stats = getStatsByType([]);

    expect(stats).toEqual({
      [WineType.Red]: 0,
      [WineType.White]: 0,
      [WineType.Rose]: 0,
      [WineType.Sparkling]: 0,
    });
  });

  it('should count bottles by type correctly', () => {
    const bottles = [
      makeBottle({ id: 'a', type: WineType.Red, history: [makeEntry(HistoryAction.Added, 3)] }),
      makeBottle({
        id: 'b',
        type: WineType.White,
        history: [makeEntry(HistoryAction.Added, 2)],
      }),
      makeBottle({ id: 'c', type: WineType.Red, history: [makeEntry(HistoryAction.Added, 1)] }),
    ];

    const stats = getStatsByType(bottles);

    expect(stats[WineType.Red]).toBe(4);
    expect(stats[WineType.White]).toBe(2);
    expect(stats[WineType.Rose]).toBe(0);
    expect(stats[WineType.Sparkling]).toBe(0);
  });

  it('should use calculated quantity from history', () => {
    const bottles = [
      makeBottle({
        type: WineType.Red,
        history: [makeEntry(HistoryAction.Added, 5), makeEntry(HistoryAction.Consumed, 3)],
      }),
    ];

    const stats = getStatsByType(bottles);

    expect(stats[WineType.Red]).toBe(2);
  });
});

describe('getTopRegions', () => {
  it('should return empty array when bottles array is empty', () => {
    expect(getTopRegions([], 3)).toEqual([]);
  });

  it('should return regions sorted by count descending', () => {
    const bottles = [
      makeBottle({
        id: 'a',
        region: 'Bordeaux',
        history: [makeEntry(HistoryAction.Added, 5)],
      }),
      makeBottle({
        id: 'b',
        region: 'Burgundy',
        history: [makeEntry(HistoryAction.Added, 8)],
      }),
      makeBottle({
        id: 'c',
        region: 'Loire',
        history: [makeEntry(HistoryAction.Added, 2)],
      }),
    ];

    const result = getTopRegions(bottles, 3);

    expect(result).toEqual([
      { region: 'Burgundy', count: 8 },
      { region: 'Bordeaux', count: 5 },
      { region: 'Loire', count: 2 },
    ]);
  });

  it('should limit results to the specified count', () => {
    const bottles = [
      makeBottle({ id: 'a', region: 'Bordeaux', history: [makeEntry(HistoryAction.Added, 5)] }),
      makeBottle({ id: 'b', region: 'Burgundy', history: [makeEntry(HistoryAction.Added, 8)] }),
      makeBottle({ id: 'c', region: 'Loire', history: [makeEntry(HistoryAction.Added, 2)] }),
    ];

    const result = getTopRegions(bottles, 2);

    expect(result).toHaveLength(2);
    expect(result[0].region).toBe('Burgundy');
    expect(result[1].region).toBe('Bordeaux');
  });

  it('should return fewer than limit when not enough regions exist', () => {
    const bottles = [
      makeBottle({ region: 'Bordeaux', history: [makeEntry(HistoryAction.Added, 3)] }),
    ];

    const result = getTopRegions(bottles, 3);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ region: 'Bordeaux', count: 3 });
  });

  it('should aggregate quantities for bottles in the same region', () => {
    const bottles = [
      makeBottle({
        id: 'a',
        region: 'Bordeaux',
        history: [makeEntry(HistoryAction.Added, 3)],
      }),
      makeBottle({
        id: 'b',
        region: 'Bordeaux',
        history: [makeEntry(HistoryAction.Added, 2)],
      }),
    ];

    const result = getTopRegions(bottles, 3);

    expect(result).toEqual([{ region: 'Bordeaux', count: 5 }]);
  });

  it('should exclude regions where all bottles have 0 quantity', () => {
    const bottles = [
      makeBottle({
        id: 'a',
        region: 'Bordeaux',
        history: [makeEntry(HistoryAction.Added, 3), makeEntry(HistoryAction.Consumed, 3)],
      }),
      makeBottle({
        id: 'b',
        region: 'Burgundy',
        history: [makeEntry(HistoryAction.Added, 2)],
      }),
    ];

    const result = getTopRegions(bottles, 3);

    expect(result).toEqual([{ region: 'Burgundy', count: 2 }]);
  });
});

describe('getRecentActivity', () => {
  it('should return empty array when bottles array is empty', () => {
    expect(getRecentActivity([], 10)).toEqual([]);
  });

  it('should return entries sorted by date descending', () => {
    const bottles = [
      makeBottle({
        name: 'Wine A',
        vintage: 2015,
        history: [
          makeEntry(HistoryAction.Added, 3, '2026-01-01'),
          makeEntry(HistoryAction.Consumed, 1, '2026-02-10'),
        ],
      }),
    ];

    const result = getRecentActivity(bottles, 10);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-02-10');
    expect(result[1].date).toBe('2026-01-01');
  });

  it('should enrich entries with bottle name and vintage', () => {
    const bottles = [
      makeBottle({
        name: 'Chateau Margaux',
        vintage: 2015,
        history: [makeEntry(HistoryAction.Added, 3, '2026-01-15')],
      }),
    ];

    const result = getRecentActivity(bottles, 10);

    expect(result[0]).toEqual({
      date: '2026-01-15',
      action: HistoryAction.Added,
      quantity: 3,
      bottleName: 'Chateau Margaux',
      vintage: 2015,
    });
  });

  it('should limit results to the specified count', () => {
    const bottles = [
      makeBottle({
        history: [
          makeEntry(HistoryAction.Added, 1, '2026-01-01'),
          makeEntry(HistoryAction.Added, 2, '2026-01-02'),
          makeEntry(HistoryAction.Consumed, 1, '2026-01-03'),
        ],
      }),
    ];

    const result = getRecentActivity(bottles, 2);

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2026-01-03');
    expect(result[1].date).toBe('2026-01-02');
  });

  it('should merge entries from multiple bottles and sort globally', () => {
    const bottles = [
      makeBottle({
        id: 'a',
        name: 'Wine A',
        vintage: 2015,
        history: [makeEntry(HistoryAction.Added, 3, '2026-01-01')],
      }),
      makeBottle({
        id: 'b',
        name: 'Wine B',
        vintage: 2020,
        history: [makeEntry(HistoryAction.Added, 1, '2026-02-01')],
      }),
    ];

    const result = getRecentActivity(bottles, 10);

    expect(result[0].bottleName).toBe('Wine B');
    expect(result[1].bottleName).toBe('Wine A');
  });

  it('should return fewer than limit when not enough entries exist', () => {
    const bottles = [
      makeBottle({ history: [makeEntry(HistoryAction.Added, 1, '2026-01-01')] }),
    ];

    const result = getRecentActivity(bottles, 10);

    expect(result).toHaveLength(1);
  });
});

describe('formatAction', () => {
  it('should capitalize the first letter of the action', () => {
    expect(formatAction(HistoryAction.Added)).toBe('Added');
    expect(formatAction(HistoryAction.Consumed)).toBe('Consumed');
    expect(formatAction(HistoryAction.Removed)).toBe('Removed');
  });
});
