import { describe, it, expect } from 'vitest';
import { validateRating, buildUpdatedBottle } from './edit-bottle-utils';
import { HistoryAction, WineType, type Bottle } from './types';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'bottle-1',
    name: 'Chateau Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon'],
    history: [{ date: '2026-01-15', action: HistoryAction.Added, quantity: 3 }],
    ...overrides,
  };
}

describe('validateRating', () => {
  it('should return empty string for empty rating', () => {
    expect(validateRating('')).toBe('');
  });

  it('should return empty string for valid rating', () => {
    expect(validateRating('5')).toBe('');
    expect(validateRating('1')).toBe('');
    expect(validateRating('3')).toBe('');
  });

  it('should return error for rating below 1', () => {
    expect(validateRating('0')).toBe('Rating must be between 1 and 5');
  });

  it('should return error for rating above 5', () => {
    expect(validateRating('6')).toBe('Rating must be between 1 and 5');
  });

  it('should return error for non-numeric rating', () => {
    expect(validateRating('abc')).toBe('Rating must be between 1 and 5');
  });
});

describe('buildUpdatedBottle', () => {
  it('should update editable fields while preserving key fields', () => {
    const original = makeBottle({ rating: 8, notes: 'old', location: 'A1' });
    const updated = buildUpdatedBottle(original, {
      rating: '9',
      notes: 'new notes',
      location: 'B2',
      country: 'Italy',
      region: 'Tuscany',
      grapeVariety: ['Sangiovese'],
      consumeStartingFrom: '2028',
    });

    expect(updated.name).toBe('Chateau Margaux');
    expect(updated.vintage).toBe(2015);
    expect(updated.type).toBe(WineType.Red);
    expect(updated.rating).toBe(9);
    expect(updated.notes).toBe('new notes');
    expect(updated.location).toBe('B2');
    expect(updated.country).toBe('Italy');
    expect(updated.region).toBe('Tuscany');
    expect(updated.grapeVariety).toEqual(['Sangiovese']);
    expect(updated.consumeStartingFrom).toBe(2028);
  });

  it('should set optional fields to undefined when empty', () => {
    const original = makeBottle({ rating: 8, notes: 'test', location: 'A1', consumeStartingFrom: 2025 });
    const updated = buildUpdatedBottle(original, {
      rating: '',
      notes: '',
      location: '',
      country: 'France',
      region: '',
      grapeVariety: [],
      consumeStartingFrom: '',
    });

    expect(updated.rating).toBeUndefined();
    expect(updated.notes).toBeUndefined();
    expect(updated.location).toBeUndefined();
    expect(updated.region).toBeUndefined();
    expect(updated.consumeStartingFrom).toBeUndefined();
  });
});
