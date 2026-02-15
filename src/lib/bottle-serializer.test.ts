import { describe, it, expect } from 'vitest';
import { bottleToFilePath, serializeBottle, deserializeBottle } from './bottle-serializer';
import { WineType, HistoryAction } from './types';
import type { Bottle } from './types';

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'abc-123',
    name: 'Château Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon', 'Merlot'],
    history: [
      {
        date: '2024-01-15',
        action: HistoryAction.Added,
        quantity: 3,
        price: { amount: 45.0, currency: 'EUR' },
        notes: 'Bought at local wine shop',
      },
    ],
    ...overrides,
  };
}

describe('bottleToFilePath', () => {
  it('should generate correct path for red wine', () => {
    const bottle = makeBottle({ type: WineType.Red, id: 'uuid-1' });
    expect(bottleToFilePath(bottle)).toBe('wines/red/wine-uuid-1.json');
  });

  it('should generate correct path for white wine', () => {
    const bottle = makeBottle({ type: WineType.White, id: 'uuid-2' });
    expect(bottleToFilePath(bottle)).toBe('wines/white/wine-uuid-2.json');
  });

  it('should generate correct path for rosé wine', () => {
    const bottle = makeBottle({ type: WineType.Rose, id: 'uuid-3' });
    expect(bottleToFilePath(bottle)).toBe('wines/rosé/wine-uuid-3.json');
  });

  it('should generate correct path for sparkling wine', () => {
    const bottle = makeBottle({ type: WineType.Sparkling, id: 'uuid-4' });
    expect(bottleToFilePath(bottle)).toBe('wines/sparkling/wine-uuid-4.json');
  });
});

describe('serializeBottle', () => {
  it('should produce pretty-printed JSON with 2-space indentation', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    const lines = json.split('\n');

    // Check indentation uses 2 spaces
    expect(lines[1]).toMatch(/^ {2}"/);
  });

  it('should end with a trailing newline', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    expect(json.endsWith('\n')).toBe(true);
  });

  it('should maintain consistent key ordering matching PROJECT.md schema', () => {
    const bottle = makeBottle({ location: 'Rack A', rating: 8.5, notes: 'Great wine' });
    const json = serializeBottle(bottle);
    const parsed = JSON.parse(json);
    const keys = Object.keys(parsed);

    expect(keys).toEqual([
      'id',
      'name',
      'vintage',
      'type',
      'country',
      'region',
      'grapeVariety',
      'location',
      'rating',
      'notes',
      'history',
    ]);
  });

  it('should order history entry keys consistently', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    const parsed = JSON.parse(json);
    const historyKeys = Object.keys(parsed.history[0]);

    expect(historyKeys).toEqual(['date', 'action', 'quantity', 'price', 'notes']);
  });

  it('should order price keys consistently', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    const parsed = JSON.parse(json);
    const priceKeys = Object.keys(parsed.history[0].price);

    expect(priceKeys).toEqual(['amount', 'currency']);
  });

  it('should omit undefined optional fields', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    const parsed = JSON.parse(json);

    expect(parsed).not.toHaveProperty('location');
    expect(parsed).not.toHaveProperty('rating');
    expect(parsed).not.toHaveProperty('notes');
  });

  it('should produce valid JSON that can be round-tripped', () => {
    const bottle = makeBottle({ location: 'Rack A', rating: 9.0 });
    const json = serializeBottle(bottle);
    const deserialized = deserializeBottle(json);

    expect(deserialized).toEqual(bottle);
  });
});

describe('deserializeBottle', () => {
  it('should parse valid bottle JSON', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    const result = deserializeBottle(json);

    expect(result).toEqual(bottle);
  });

  it('should return null for invalid JSON', () => {
    expect(deserializeBottle('not json')).toBeNull();
  });

  it('should return null when required fields are missing', () => {
    expect(deserializeBottle(JSON.stringify({ id: 'x' }))).toBeNull();
  });

  it('should return null for invalid wine type', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle).replace('"red"', '"purple"');
    expect(deserializeBottle(json)).toBeNull();
  });

  it('should return null for invalid history action', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle).replace('"added"', '"stolen"');
    expect(deserializeBottle(json)).toBeNull();
  });

  it('should return null when grapeVariety is not an array', () => {
    const data = { ...makeBottle(), grapeVariety: 'Merlot' };
    expect(deserializeBottle(JSON.stringify(data))).toBeNull();
  });

  it('should return null when vintage is not an integer', () => {
    const data = { ...makeBottle(), vintage: 2015.5 };
    expect(deserializeBottle(JSON.stringify(data))).toBeNull();
  });

  it('should accept bottle with all optional fields', () => {
    const bottle = makeBottle({ location: 'Rack A', rating: 8.5, notes: 'Excellent' });
    const json = serializeBottle(bottle);
    expect(deserializeBottle(json)).toEqual(bottle);
  });

  it('should accept bottle with no optional fields', () => {
    const bottle = makeBottle();
    const json = serializeBottle(bottle);
    expect(deserializeBottle(json)).toEqual(bottle);
  });

  it('should accept history entry without price and notes', () => {
    const bottle = makeBottle({
      history: [{ date: '2024-01-15', action: HistoryAction.Consumed, quantity: 1 }],
    });
    const json = serializeBottle(bottle);
    expect(deserializeBottle(json)).toEqual(bottle);
  });

  it('should return null for empty string', () => {
    expect(deserializeBottle('')).toBeNull();
  });

  it('should return null when name is empty', () => {
    const data = { ...makeBottle(), name: '' };
    expect(deserializeBottle(JSON.stringify(data))).toBeNull();
  });
});
