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
    expect(validateRating('10')).toBe('');
  });

  it('should return error for rating below 1', () => {
    expect(validateRating('0')).toBe('Rating must be between 1 and 10');
  });

  it('should return error for rating above 10', () => {
    expect(validateRating('11')).toBe('Rating must be between 1 and 10');
  });

  it('should return error for non-numeric rating', () => {
    expect(validateRating('abc')).toBe('Rating must be between 1 and 10');
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
  });

  it('should set optional fields to undefined when empty', () => {
    const original = makeBottle({ rating: 8, notes: 'test', location: 'A1' });
    const updated = buildUpdatedBottle(original, {
      rating: '',
      notes: '',
      location: '',
      country: 'France',
      region: '',
      grapeVariety: [],
    });

    expect(updated.rating).toBeUndefined();
    expect(updated.notes).toBeUndefined();
    expect(updated.location).toBeUndefined();
    expect(updated.region).toBeUndefined();
  });
});
