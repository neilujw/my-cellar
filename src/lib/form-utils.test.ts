import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  createBottleFromForm,
  createEmptyFormData,
  createHistoryEntryFromForm,
  validateForm,
  type FormData,
} from './form-utils';
import { HistoryAction, WineType } from './types';

function validFormData(overrides: Partial<FormData> = {}): FormData {
  return {
    ...createEmptyFormData(),
    name: 'Chateau Margaux',
    vintage: '2015',
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    quantity: '3',
    ...overrides,
  };
}

describe('validateForm', () => {
  it('should return no errors for valid data', () => {
    const errors = validateForm(validFormData());

    expect(errors).toEqual({});
  });

  it('should require name', () => {
    const errors = validateForm(validFormData({ name: '  ' }));

    expect(errors.name).toBe('Name is required');
  });

  it('should require vintage to be a valid year', () => {
    expect(validateForm(validFormData({ vintage: '' })).vintage).toBeDefined();
    expect(validateForm(validFormData({ vintage: 'abc' })).vintage).toBeDefined();
    expect(validateForm(validFormData({ vintage: '1899' })).vintage).toBeDefined();
    expect(validateForm(validFormData({ vintage: '2100' })).vintage).toBeDefined();
    expect(validateForm(validFormData({ vintage: '2015.5' })).vintage).toBeDefined();
  });

  it('should accept vintage at boundaries', () => {
    expect(validateForm(validFormData({ vintage: '1900' })).vintage).toBeUndefined();
    expect(validateForm(validFormData({ vintage: '2099' })).vintage).toBeUndefined();
  });

  it('should require wine type', () => {
    expect(validateForm(validFormData({ type: '' })).type).toBeDefined();
    expect(validateForm(validFormData({ type: 'invalid' })).type).toBeDefined();
  });

  it('should require country', () => {
    const errors = validateForm(validFormData({ country: '' }));

    expect(errors.country).toBe('Country is required');
  });

  it('should require region', () => {
    const errors = validateForm(validFormData({ region: '' }));

    expect(errors.region).toBe('Region is required');
  });

  it('should require quantity >= 1', () => {
    expect(validateForm(validFormData({ quantity: '0' })).quantity).toBeDefined();
    expect(validateForm(validFormData({ quantity: '-1' })).quantity).toBeDefined();
    expect(validateForm(validFormData({ quantity: 'abc' })).quantity).toBeDefined();
    expect(validateForm(validFormData({ quantity: '1.5' })).quantity).toBeDefined();
  });

  it('should validate rating between 1 and 10 when provided', () => {
    expect(validateForm(validFormData({ rating: '0' })).rating).toBeDefined();
    expect(validateForm(validFormData({ rating: '11' })).rating).toBeDefined();
    expect(validateForm(validFormData({ rating: 'abc' })).rating).toBeDefined();
  });

  it('should allow empty rating', () => {
    const errors = validateForm(validFormData({ rating: '' }));

    expect(errors.rating).toBeUndefined();
  });

  it('should validate price amount > 0 when provided', () => {
    expect(validateForm(validFormData({ priceAmount: '0' })).priceAmount).toBeDefined();
    expect(validateForm(validFormData({ priceAmount: '-5' })).priceAmount).toBeDefined();
    expect(validateForm(validFormData({ priceAmount: 'abc' })).priceAmount).toBeDefined();
  });

  it('should allow empty price', () => {
    const errors = validateForm(validFormData({ priceAmount: '' }));

    expect(errors.priceAmount).toBeUndefined();
  });

  it('should return multiple errors at once', () => {
    const errors = validateForm(createEmptyFormData());

    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(5);
  });
});

describe('createBottleFromForm', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('test-uuid-1234');
  });

  it('should create a bottle with required fields and initial history entry', () => {
    const bottle = createBottleFromForm(validFormData());

    expect(bottle.id).toBe('test-uuid-1234');
    expect(bottle.name).toBe('Chateau Margaux');
    expect(bottle.vintage).toBe(2015);
    expect(bottle.type).toBe(WineType.Red);
    expect(bottle.country).toBe('France');
    expect(bottle.region).toBe('Bordeaux');
    expect(bottle.history).toHaveLength(1);
    expect(bottle.history[0].action).toBe(HistoryAction.Added);
    expect(bottle.history[0].quantity).toBe(3);
  });

  it('should include optional fields when provided', () => {
    const bottle = createBottleFromForm(
      validFormData({
        location: 'Rack A',
        rating: '8',
        notes: 'Great wine',
        grapeVariety: ['Cabernet Sauvignon', 'Merlot'],
      }),
    );

    expect(bottle.location).toBe('Rack A');
    expect(bottle.rating).toBe(8);
    expect(bottle.notes).toBe('Great wine');
    expect(bottle.grapeVariety).toEqual(['Cabernet Sauvignon', 'Merlot']);
  });

  it('should omit optional fields when empty', () => {
    const bottle = createBottleFromForm(validFormData());

    expect(bottle.location).toBeUndefined();
    expect(bottle.rating).toBeUndefined();
    expect(bottle.notes).toBeUndefined();
    expect(bottle.grapeVariety).toEqual([]);
  });

  it('should trim whitespace from string fields', () => {
    const bottle = createBottleFromForm(validFormData({ name: '  Chateau Margaux  ' }));

    expect(bottle.name).toBe('Chateau Margaux');
  });

  it('should include price in history entry when provided', () => {
    const bottle = createBottleFromForm(
      validFormData({ priceAmount: '45', priceCurrency: 'USD' }),
    );

    expect(bottle.history[0].price).toEqual({ amount: 45, currency: 'USD' });
  });
});

describe('createHistoryEntryFromForm', () => {
  it('should create an added history entry with today date', () => {
    const today = new Date().toISOString().split('T')[0];
    const entry = createHistoryEntryFromForm(validFormData());

    expect(entry.date).toBe(today);
    expect(entry.action).toBe(HistoryAction.Added);
    expect(entry.quantity).toBe(3);
  });

  it('should include price when amount is provided', () => {
    const entry = createHistoryEntryFromForm(
      validFormData({ priceAmount: '25.50', priceCurrency: 'EUR' }),
    );

    expect(entry.price).toEqual({ amount: 25.5, currency: 'EUR' });
  });

  it('should default price currency to EUR', () => {
    const entry = createHistoryEntryFromForm(
      validFormData({ priceAmount: '10', priceCurrency: '' }),
    );

    expect(entry.price?.currency).toBe('EUR');
  });

  it('should omit price when amount is empty', () => {
    const entry = createHistoryEntryFromForm(validFormData({ priceAmount: '' }));

    expect(entry.price).toBeUndefined();
  });

  it('should include notes when provided', () => {
    const entry = createHistoryEntryFromForm(validFormData({ historyNotes: 'Wine shop deal' }));

    expect(entry.notes).toBe('Wine shop deal');
  });

  it('should omit notes when empty', () => {
    const entry = createHistoryEntryFromForm(validFormData({ historyNotes: '' }));

    expect(entry.notes).toBeUndefined();
  });
});
