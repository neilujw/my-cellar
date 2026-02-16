import { describe, it, expect } from 'vitest';

import {
  countActiveFilters,
  createEmptyFilters,
  filterBottles,
  getUniqueCountries,
  getUniqueRegions,
  sortBottles,
  type SearchFilters,
} from './search-utils';
import { HistoryAction, WineType, type Bottle } from './types';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'test-id',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 3 }],
    ...overrides,
  };
}

const emptyFilters = createEmptyFilters();

describe('filterBottles', () => {
  describe('text search', () => {
    it('should filter bottles by name with case-insensitive partial match', () => {
      const bottles = [
        makeBottle({ id: '1', name: 'Chateau Margaux' }),
        makeBottle({ id: '2', name: 'Petrus' }),
        makeBottle({ id: '3', name: 'Chateau Latour' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, searchText: 'chateau' });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.name)).toEqual(['Chateau Margaux', 'Chateau Latour']);
    });

    it('should return all bottles when search text is empty', () => {
      const bottles = [
        makeBottle({ id: '1', name: 'Chateau Margaux' }),
        makeBottle({ id: '2', name: 'Petrus' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, searchText: '' });

      expect(result).toHaveLength(2);
    });
  });

  describe('type filter', () => {
    it('should filter by a single wine type', () => {
      const bottles = [
        makeBottle({ id: '1', type: WineType.Red }),
        makeBottle({ id: '2', type: WineType.White }),
        makeBottle({ id: '3', type: WineType.Red }),
      ];

      const result = filterBottles(bottles, {
        ...emptyFilters,
        types: [WineType.Red],
      });

      expect(result).toHaveLength(2);
      expect(result.every((b) => b.type === WineType.Red)).toBe(true);
    });

    it('should filter by multiple wine types', () => {
      const bottles = [
        makeBottle({ id: '1', type: WineType.Red }),
        makeBottle({ id: '2', type: WineType.White }),
        makeBottle({ id: '3', type: WineType.Sparkling }),
      ];

      const result = filterBottles(bottles, {
        ...emptyFilters,
        types: [WineType.Red, WineType.White],
      });

      expect(result).toHaveLength(2);
    });

    it('should return all bottles when no types are selected', () => {
      const bottles = [
        makeBottle({ id: '1', type: WineType.Red }),
        makeBottle({ id: '2', type: WineType.White }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, types: [] });

      expect(result).toHaveLength(2);
    });
  });

  describe('country filter', () => {
    it('should filter by exact country match', () => {
      const bottles = [
        makeBottle({ id: '1', country: 'France' }),
        makeBottle({ id: '2', country: 'Italy' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, country: 'France' });

      expect(result).toHaveLength(1);
      expect(result[0].country).toBe('France');
    });

    it('should return all bottles when country filter is empty', () => {
      const bottles = [
        makeBottle({ id: '1', country: 'France' }),
        makeBottle({ id: '2', country: 'Italy' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, country: '' });

      expect(result).toHaveLength(2);
    });
  });

  describe('region filter', () => {
    it('should filter by exact region match', () => {
      const bottles = [
        makeBottle({ id: '1', region: 'Bordeaux' }),
        makeBottle({ id: '2', region: 'Burgundy' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, region: 'Bordeaux' });

      expect(result).toHaveLength(1);
      expect(result[0].region).toBe('Bordeaux');
    });

    it('should return all bottles when region filter is empty', () => {
      const bottles = [
        makeBottle({ id: '1', region: 'Bordeaux' }),
        makeBottle({ id: '2', region: 'Burgundy' }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, region: '' });

      expect(result).toHaveLength(2);
    });
  });

  describe('vintage range filter', () => {
    it('should filter with min vintage only', () => {
      const bottles = [
        makeBottle({ id: '1', vintage: 2010 }),
        makeBottle({ id: '2', vintage: 2015 }),
        makeBottle({ id: '3', vintage: 2020 }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, vintageMin: 2015 });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.vintage)).toEqual([2015, 2020]);
    });

    it('should filter with max vintage only', () => {
      const bottles = [
        makeBottle({ id: '1', vintage: 2010 }),
        makeBottle({ id: '2', vintage: 2015 }),
        makeBottle({ id: '3', vintage: 2020 }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, vintageMax: 2015 });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.vintage)).toEqual([2010, 2015]);
    });

    it('should filter with both min and max vintage', () => {
      const bottles = [
        makeBottle({ id: '1', vintage: 2010 }),
        makeBottle({ id: '2', vintage: 2015 }),
        makeBottle({ id: '3', vintage: 2020 }),
      ];

      const result = filterBottles(bottles, {
        ...emptyFilters,
        vintageMin: 2012,
        vintageMax: 2018,
      });

      expect(result).toHaveLength(1);
      expect(result[0].vintage).toBe(2015);
    });

    it('should return all bottles when no vintage range is set', () => {
      const bottles = [
        makeBottle({ id: '1', vintage: 2010 }),
        makeBottle({ id: '2', vintage: 2020 }),
      ];

      const result = filterBottles(bottles, emptyFilters);

      expect(result).toHaveLength(2);
    });
  });

  describe('minimum rating filter', () => {
    it('should filter bottles with rating below minimum', () => {
      const bottles = [
        makeBottle({ id: '1', rating: 8 }),
        makeBottle({ id: '2', rating: 5 }),
        makeBottle({ id: '3', rating: 9 }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, minRating: 7 });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.rating)).toEqual([8, 9]);
    });

    it('should exclude unrated bottles when minimum rating filter is active', () => {
      const bottles = [
        makeBottle({ id: '1', rating: 8 }),
        makeBottle({ id: '2', rating: undefined }),
      ];

      const result = filterBottles(bottles, { ...emptyFilters, minRating: 5 });

      expect(result).toHaveLength(1);
      expect(result[0].rating).toBe(8);
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters with AND logic', () => {
      const bottles = [
        makeBottle({ id: '1', name: 'Chateau Margaux', type: WineType.Red, country: 'France' }),
        makeBottle({ id: '2', name: 'Chateau Latour', type: WineType.Red, country: 'France' }),
        makeBottle({ id: '3', name: 'Chateau Margaux', type: WineType.White, country: 'France' }),
        makeBottle({ id: '4', name: 'Barolo Riserva', type: WineType.Red, country: 'Italy' }),
      ];

      const result = filterBottles(bottles, {
        ...emptyFilters,
        searchText: 'chateau',
        types: [WineType.Red],
        country: 'France',
      });

      expect(result).toHaveLength(2);
      expect(result.map((b) => b.id)).toEqual(['1', '2']);
    });
  });
});

describe('sortBottles', () => {
  it('should sort by name alphabetically ascending', () => {
    const bottles = [
      makeBottle({ id: '1', name: 'Petrus' }),
      makeBottle({ id: '2', name: 'Chateau Margaux' }),
      makeBottle({ id: '3', name: 'Barolo' }),
    ];

    const result = sortBottles(bottles, 'name');

    expect(result.map((b) => b.name)).toEqual(['Barolo', 'Chateau Margaux', 'Petrus']);
  });

  it('should sort by vintage ascending', () => {
    const bottles = [
      makeBottle({ id: '1', vintage: 2020 }),
      makeBottle({ id: '2', vintage: 2010 }),
      makeBottle({ id: '3', vintage: 2015 }),
    ];

    const result = sortBottles(bottles, 'vintage');

    expect(result.map((b) => b.vintage)).toEqual([2010, 2015, 2020]);
  });

  it('should sort by rating descending with unrated bottles last', () => {
    const bottles = [
      makeBottle({ id: '1', rating: 7 }),
      makeBottle({ id: '2', rating: undefined }),
      makeBottle({ id: '3', rating: 9 }),
      makeBottle({ id: '4', rating: undefined }),
    ];

    const result = sortBottles(bottles, 'rating');

    expect(result.map((b) => b.rating)).toEqual([9, 7, undefined, undefined]);
  });

  it('should sort by quantity descending', () => {
    const bottles = [
      makeBottle({
        id: '1',
        history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 2 }],
      }),
      makeBottle({
        id: '2',
        history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 10 }],
      }),
      makeBottle({
        id: '3',
        history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 5 }],
      }),
    ];

    const result = sortBottles(bottles, 'quantity');

    expect(result.map((b) => b.id)).toEqual(['2', '3', '1']);
  });

  it('should sort by most recent history entry first', () => {
    const bottles = [
      makeBottle({
        id: '1',
        history: [{ date: '2026-01-01', action: HistoryAction.Added, quantity: 1 }],
      }),
      makeBottle({
        id: '2',
        history: [{ date: '2026-03-01', action: HistoryAction.Added, quantity: 1 }],
      }),
      makeBottle({
        id: '3',
        history: [
          { date: '2026-01-01', action: HistoryAction.Added, quantity: 1 },
          { date: '2026-02-15', action: HistoryAction.Added, quantity: 1 },
        ],
      }),
    ];

    const result = sortBottles(bottles, 'recentlyAdded');

    expect(result.map((b) => b.id)).toEqual(['2', '3', '1']);
  });

  it('should not mutate the original array', () => {
    const bottles = [
      makeBottle({ id: '1', name: 'Petrus' }),
      makeBottle({ id: '2', name: 'Barolo' }),
    ];

    const result = sortBottles(bottles, 'name');

    expect(result).not.toBe(bottles);
    expect(bottles[0].name).toBe('Petrus');
  });
});

describe('getUniqueCountries', () => {
  it('should return sorted unique countries', () => {
    const bottles = [
      makeBottle({ id: '1', country: 'Italy' }),
      makeBottle({ id: '2', country: 'France' }),
      makeBottle({ id: '3', country: 'France' }),
      makeBottle({ id: '4', country: 'Spain' }),
    ];

    const result = getUniqueCountries(bottles);

    expect(result).toEqual(['France', 'Italy', 'Spain']);
  });

  it('should return empty array for no bottles', () => {
    expect(getUniqueCountries([])).toEqual([]);
  });
});

describe('getUniqueRegions', () => {
  it('should return sorted unique regions', () => {
    const bottles = [
      makeBottle({ id: '1', region: 'Tuscany' }),
      makeBottle({ id: '2', region: 'Bordeaux' }),
      makeBottle({ id: '3', region: 'Bordeaux' }),
      makeBottle({ id: '4', region: 'Rioja' }),
    ];

    const result = getUniqueRegions(bottles);

    expect(result).toEqual(['Bordeaux', 'Rioja', 'Tuscany']);
  });

  it('should return empty array for no bottles', () => {
    expect(getUniqueRegions([])).toEqual([]);
  });

  it('should filter out undefined regions', () => {
    const bottles = [
      makeBottle({ id: '1', region: 'Bordeaux' }),
      makeBottle({ id: '2', region: undefined }),
      makeBottle({ id: '3', region: 'Tuscany' }),
    ];

    const result = getUniqueRegions(bottles);

    expect(result).toEqual(['Bordeaux', 'Tuscany']);
  });
});

describe('countActiveFilters', () => {
  it('should return 0 for empty filters', () => {
    expect(countActiveFilters(createEmptyFilters())).toBe(0);
  });

  it('should count each active filter criterion', () => {
    const filters: SearchFilters = {
      searchText: 'test',
      types: [WineType.Red],
      country: 'France',
      region: '',
      vintageMin: 2010,
      vintageMax: undefined,
      minRating: 7,
    };

    // types + country + vintageMin + minRating = 4 (searchText is excluded)
    expect(countActiveFilters(filters)).toBe(4);
  });
});
