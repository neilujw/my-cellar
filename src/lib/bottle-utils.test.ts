import { describe, it, expect } from "vitest";

import {
  calculateQuantity,
  createConsumeHistoryEntry,
  createRemoveHistoryEntry,
  applyHistoryEntry,
  findDuplicate,
  formatVintage,
  searchBottlesByName,
} from "./bottle-utils";
import {
  HistoryAction,
  WineType,
  type Bottle,
  type HistoryEntry,
} from "./types";

function makeEntry(action: HistoryAction, quantity: number): HistoryEntry {
  return { date: "2025-01-01", action, quantity };
}

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: "test-id",
    name: "Chateau Margaux",
    vintage: 2015,
    type: WineType.Red,
    country: "France",
    region: "Bordeaux",
    grapeVariety: ["Cabernet Sauvignon"],
    history: [],
    ...overrides,
  };
}

describe("calculateQuantity", () => {
  it("should return 0 when history is empty", () => {
    expect(calculateQuantity([])).toBe(0);
  });

  it("should return correct quantity for a single added entry", () => {
    const history = [makeEntry(HistoryAction.Added, 5)];

    expect(calculateQuantity(history)).toBe(5);
  });

  it("should compute correctly with mixed actions", () => {
    const history = [
      makeEntry(HistoryAction.Added, 3),
      makeEntry(HistoryAction.Consumed, 1),
    ];

    expect(calculateQuantity(history)).toBe(2);
  });

  it("should never return a negative number", () => {
    const history = [
      makeEntry(HistoryAction.Added, 1),
      makeEntry(HistoryAction.Removed, 5),
    ];

    expect(calculateQuantity(history)).toBe(0);
  });

  it("should handle removed actions the same as consumed", () => {
    const history = [
      makeEntry(HistoryAction.Added, 10),
      makeEntry(HistoryAction.Consumed, 3),
      makeEntry(HistoryAction.Removed, 2),
    ];

    expect(calculateQuantity(history)).toBe(5);
  });
});

describe("createConsumeHistoryEntry", () => {
  it("should return a consumed entry with quantity 1 and today's date", () => {
    const entry = createConsumeHistoryEntry();

    expect(entry.action).toBe(HistoryAction.Consumed);
    expect(entry.quantity).toBe(1);
    expect(entry.date).toBe(new Date().toISOString().split("T")[0]);
  });

  it("should not include price or notes", () => {
    const entry = createConsumeHistoryEntry();

    expect(entry.price).toBeUndefined();
    expect(entry.notes).toBeUndefined();
  });
});

describe("createRemoveHistoryEntry", () => {
  it("should return a removed entry with quantity 1 and today's date", () => {
    const entry = createRemoveHistoryEntry();

    expect(entry.action).toBe(HistoryAction.Removed);
    expect(entry.quantity).toBe(1);
    expect(entry.date).toBe(new Date().toISOString().split("T")[0]);
  });

  it("should not include price or notes", () => {
    const entry = createRemoveHistoryEntry();

    expect(entry.price).toBeUndefined();
    expect(entry.notes).toBeUndefined();
  });
});

describe("applyHistoryEntry", () => {
  it("should return a new bottle with the entry appended to history", () => {
    const bottle = makeBottle({
      history: [makeEntry(HistoryAction.Added, 3)],
    });
    const entry = makeEntry(HistoryAction.Consumed, 1);

    const result = applyHistoryEntry(bottle, entry);

    expect(result.history).toHaveLength(2);
    expect(result.history[1]).toEqual(entry);
  });

  it("should not mutate the original bottle", () => {
    const bottle = makeBottle({
      history: [makeEntry(HistoryAction.Added, 3)],
    });
    const entry = makeEntry(HistoryAction.Consumed, 1);

    applyHistoryEntry(bottle, entry);

    expect(bottle.history).toHaveLength(1);
  });

  it("should preserve all other bottle fields", () => {
    const bottle = makeBottle({ name: "Test Wine", vintage: 2020, rating: 8 });
    const entry = makeEntry(HistoryAction.Consumed, 1);

    const result = applyHistoryEntry(bottle, entry);

    expect(result.name).toBe("Test Wine");
    expect(result.vintage).toBe(2020);
    expect(result.rating).toBe(8);
    expect(result.id).toBe(bottle.id);
  });

  it("should work on a bottle with empty history", () => {
    const bottle = makeBottle({ history: [] });
    const entry = makeEntry(HistoryAction.Added, 5);

    const result = applyHistoryEntry(bottle, entry);

    expect(result.history).toHaveLength(1);
    expect(result.history[0]).toEqual(entry);
  });
});

describe("findDuplicate", () => {
  it("should return matching bottle on exact match", () => {
    const bottle = makeBottle();
    const bottles = [bottle];

    const result = findDuplicate(
      bottles,
      WineType.Red,
      2015,
      "Chateau Margaux",
    );

    expect(result).toBe(bottle);
  });

  it("should match name case-insensitively", () => {
    const bottle = makeBottle();
    const bottles = [bottle];

    const result = findDuplicate(
      bottles,
      WineType.Red,
      2015,
      "chateau margaux",
    );

    expect(result).toBe(bottle);
  });

  it("should return undefined when no match exists", () => {
    const bottles = [makeBottle()];

    const result = findDuplicate(bottles, WineType.Red, 2015, "Petrus");

    expect(result).toBeUndefined();
  });

  it("should not match when only some fields match", () => {
    const bottles = [makeBottle()];

    // Same name and vintage but different type
    const result = findDuplicate(
      bottles,
      WineType.White,
      2015,
      "Chateau Margaux",
    );

    expect(result).toBeUndefined();
  });

  it("should not match when vintage differs", () => {
    const bottles = [makeBottle()];

    const result = findDuplicate(
      bottles,
      WineType.Red,
      2020,
      "Chateau Margaux",
    );

    expect(result).toBeUndefined();
  });

  it("should return undefined when bottles array is empty", () => {
    const result = findDuplicate([], WineType.Red, 2015, "Chateau Margaux");

    expect(result).toBeUndefined();
  });
});

describe("searchBottlesByName", () => {
  it("should return matching bottles on partial name match", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const results = searchBottlesByName(bottles, "Marg");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Chateau Margaux");
  });

  it("should match case-insensitively", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const results = searchBottlesByName(bottles, "chateau");

    expect(results).toHaveLength(1);
  });

  it("should return empty array when no match exists", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const results = searchBottlesByName(bottles, "Petrus");

    expect(results).toHaveLength(0);
  });

  it("should return empty array when query is fewer than 2 characters", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    expect(searchBottlesByName(bottles, "")).toHaveLength(0);
    expect(searchBottlesByName(bottles, "C")).toHaveLength(0);
  });

  it("should return empty array when bottles list is empty", () => {
    const results = searchBottlesByName([], "Chateau");

    expect(results).toHaveLength(0);
  });

  it("should return results sorted alphabetically by name", () => {
    const bottles = [
      makeBottle({ id: "1", name: "Zinfandel Reserve" }),
      makeBottle({ id: "2", name: "Côtes du Rhône" }),
      makeBottle({ id: "3", name: "Amarone della" }),
    ];

    const results = searchBottlesByName(bottles, "del");

    expect(results).toHaveLength(2);
    expect(results[0].name).toBe("Amarone della");
    expect(results[1].name).toBe("Zinfandel Reserve");
  });

  it("should match substring anywhere in the name", () => {
    const bottles = [makeBottle({ name: "Grand Cru Classé" })];

    const results = searchBottlesByName(bottles, "Cru");

    expect(results).toHaveLength(1);
  });

  it("should match accent-insensitively (query without accents matches accented name)", () => {
    const bottles = [makeBottle({ name: "Château Margaux" })];

    const results = searchBottlesByName(bottles, "Chateau");

    expect(results).toHaveLength(1);
  });

  it("should match accent-insensitively (accented query matches plain name)", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const results = searchBottlesByName(bottles, "Châ");

    expect(results).toHaveLength(1);
  });

  it("should match all query words regardless of order in name", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const results = searchBottlesByName(bottles, "margaux chateau");

    expect(results).toHaveLength(1);
  });

  it("should require all words to match", () => {
    const bottles = [
      makeBottle({ id: "1", name: "Chateau Margaux" }),
      makeBottle({ id: "2", name: "Chateau Latour" }),
    ];

    const results = searchBottlesByName(bottles, "chateau mar");

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe("Chateau Margaux");
  });
});

describe("formatVintage", () => {
  it('should return "N/A" for vintage 0', () => {
    expect(formatVintage(0)).toBe("N/A");
  });

  it("should return the year as string for a normal vintage", () => {
    expect(formatVintage(2015)).toBe("2015");
    expect(formatVintage(1900)).toBe("1900");
  });
});

describe("findDuplicate — accent-insensitive", () => {
  it("should match accented name with plain query", () => {
    const bottles = [makeBottle({ name: "Château Margaux" })];

    const result = findDuplicate(
      bottles,
      WineType.Red,
      2015,
      "Chateau Margaux",
    );

    expect(result).toBeDefined();
  });

  it("should match plain name with accented query", () => {
    const bottles = [makeBottle({ name: "Chateau Margaux" })];

    const result = findDuplicate(
      bottles,
      WineType.Red,
      2015,
      "Château Margaux",
    );

    expect(result).toBeDefined();
  });

  it("should match two NV bottles with same name and type as duplicates", () => {
    const bottles = [makeBottle({ name: "Champagne Brut", vintage: 0 })];

    const result = findDuplicate(bottles, WineType.Red, 0, "Champagne Brut");

    expect(result).toBeDefined();
  });
});
