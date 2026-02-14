import { describe, it, expect } from 'vitest';

import { calculateQuantity, findDuplicate } from './bottle-utils';
import { HistoryAction, WineType, type Bottle, type HistoryEntry } from './types';

function makeEntry(action: HistoryAction, quantity: number): HistoryEntry {
  return { date: '2025-01-01', action, quantity };
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
    history: [],
    ...overrides,
  };
}

describe('calculateQuantity', () => {
  it('should return 0 when history is empty', () => {
    expect(calculateQuantity([])).toBe(0);
  });

  it('should return correct quantity for a single added entry', () => {
    const history = [makeEntry(HistoryAction.Added, 5)];

    expect(calculateQuantity(history)).toBe(5);
  });

  it('should compute correctly with mixed actions', () => {
    const history = [
      makeEntry(HistoryAction.Added, 3),
      makeEntry(HistoryAction.Consumed, 1),
    ];

    expect(calculateQuantity(history)).toBe(2);
  });

  it('should never return a negative number', () => {
    const history = [
      makeEntry(HistoryAction.Added, 1),
      makeEntry(HistoryAction.Removed, 5),
    ];

    expect(calculateQuantity(history)).toBe(0);
  });

  it('should handle removed actions the same as consumed', () => {
    const history = [
      makeEntry(HistoryAction.Added, 10),
      makeEntry(HistoryAction.Consumed, 3),
      makeEntry(HistoryAction.Removed, 2),
    ];

    expect(calculateQuantity(history)).toBe(5);
  });
});

describe('findDuplicate', () => {
  it('should return matching bottle on exact match', () => {
    const bottle = makeBottle();
    const bottles = [bottle];

    const result = findDuplicate(bottles, WineType.Red, 2015, 'Chateau Margaux');

    expect(result).toBe(bottle);
  });

  it('should match name case-insensitively', () => {
    const bottle = makeBottle();
    const bottles = [bottle];

    const result = findDuplicate(bottles, WineType.Red, 2015, 'chateau margaux');

    expect(result).toBe(bottle);
  });

  it('should return undefined when no match exists', () => {
    const bottles = [makeBottle()];

    const result = findDuplicate(bottles, WineType.Red, 2015, 'Petrus');

    expect(result).toBeUndefined();
  });

  it('should not match when only some fields match', () => {
    const bottles = [makeBottle()];

    // Same name and vintage but different type
    const result = findDuplicate(bottles, WineType.White, 2015, 'Chateau Margaux');

    expect(result).toBeUndefined();
  });

  it('should not match when vintage differs', () => {
    const bottles = [makeBottle()];

    const result = findDuplicate(bottles, WineType.Red, 2020, 'Chateau Margaux');

    expect(result).toBeUndefined();
  });

  it('should return undefined when bottles array is empty', () => {
    const result = findDuplicate([], WineType.Red, 2015, 'Chateau Margaux');

    expect(result).toBeUndefined();
  });
});
