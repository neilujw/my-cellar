# Feature Data Model & Local Storage

Plan created at 2026-02-14

## Goal

Define the TypeScript data model for bottles and history entries, implement IndexedDB-based local storage for offline persistence, and create utility functions for quantity calculation and duplicate detection. This step establishes the data foundation that all subsequent features (dashboard, add bottle, search, sync) will build upon.

## Acceptance criterias

- [x] TypeScript types are defined for `Bottle`, `HistoryEntry`, `Price`, `WineType`, `HistoryAction`, and `Currency`
- [x] Types use enums for fixed value sets (`WineType`, `HistoryAction`) and readonly modifiers for immutable data
- [x] IndexedDB database is created with a `bottles` object store using `id` as key path
- [x] IndexedDB store has indexes on `type`, `vintage`, and `name` for efficient querying
- [x] CRUD operations work: `addBottle`, `getBottle`, `getAllBottles`, `updateBottle`, `deleteBottle`
- [x] `calculateQuantity(history)` returns the correct current quantity (sum of added minus consumed and removed)
- [x] `calculateQuantity` returns 0 for an empty history array
- [x] `calculateQuantity` never returns a negative number (clamps to 0)
- [x] `findDuplicate(bottles, type, vintage, name)` returns the matching bottle when a duplicate exists
- [x] `findDuplicate` returns `undefined` when no duplicate exists
- [x] `findDuplicate` matching is case-insensitive on name
- [x] All storage operations are async and return Promises
- [x] All exported functions and types have JSDoc documentation
- [x] All tests pass
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented
- [x] `ROADMAP.md` is updated when all implementation steps are done
- [x] `CHANGELOG.md` is updated when all implementation steps are done

## Out of scope

- **UI components**: No views or forms are built in this step (that's Step 3 and Step 4)
- **GitHub sync**: No remote storage or API calls (that's Steps 6-7)
- **Offline queue**: No change tracking or sync queue (that's Step 8)
- **Migration logic**: No database version migration strategy beyond initial schema (can be addressed when needed)

## Implementation Steps

1. **Install dependencies**
   - [x] Install `idb` (exact version, pinned) as a runtime dependency
   - [x] Install `fake-indexeddb` (exact version, pinned) as a dev dependency for testing IndexedDB in jsdom

2. **Define TypeScript types**
   - [x] Create `src/lib/types.ts`
   - [x] Define `WineType` enum: `"red"`, `"white"`, `"rosé"`, `"sparkling"`
   - [x] Define `HistoryAction` enum: `"added"`, `"consumed"`, `"removed"`
   - [x] Define `Currency` type (string, defaulting to `"EUR"`)
   - [x] Define `Price` interface: `{ readonly amount: number; readonly currency: Currency }`
   - [x] Define `HistoryEntry` interface with all fields from the data model
   - [x] Define `Bottle` interface with all fields from the data model
   - [x] Add JSDoc comments on all exported types and interfaces

3. **Implement IndexedDB storage layer**
   - [x] Create `src/lib/storage.ts`
   - [x] Initialize IndexedDB database `"my-cellar"` with version 1 using `idb`
   - [x] Create `bottles` object store with `id` key path
   - [x] Add indexes: `type`, `vintage`, `name`
   - [x] Implement `addBottle(bottle: Bottle): Promise<string>` — adds a bottle and returns its id
   - [x] Implement `getBottle(id: string): Promise<Bottle | undefined>` — retrieves by id
   - [x] Implement `getAllBottles(): Promise<Bottle[]>` — returns all bottles
   - [x] Implement `updateBottle(bottle: Bottle): Promise<void>` — updates an existing bottle
   - [x] Implement `deleteBottle(id: string): Promise<void>` — removes by id
   - [x] Implement `clearAll(): Promise<void>` — for testing and reset scenarios
   - [x] Add JSDoc comments on all exported functions

4. **Implement utility functions**
   - [x] Create `src/lib/bottle-utils.ts`
   - [x] Implement `calculateQuantity(history: readonly HistoryEntry[]): number`
     - Sum quantities where action is `"added"`
     - Subtract quantities where action is `"consumed"` or `"removed"`
     - Clamp result to minimum of 0
   - [x] Implement `findDuplicate(bottles: readonly Bottle[], type: WineType, vintage: number, name: string): Bottle | undefined`
     - Match on `type` (exact), `vintage` (exact), `name` (case-insensitive)
     - Return first matching bottle or `undefined`
   - [x] Add JSDoc comments on all exported functions

5. **Write tests for types and utility functions**
   - [x] Create `src/lib/bottle-utils.test.ts`
   - [x] Test `calculateQuantity`: empty history returns 0
   - [x] Test `calculateQuantity`: single "added" entry returns correct quantity
   - [x] Test `calculateQuantity`: mixed actions compute correctly (add 3, consume 1 = 2)
   - [x] Test `calculateQuantity`: result never goes below 0 (add 1, remove 5 = 0)
   - [x] Test `findDuplicate`: returns matching bottle on exact match
   - [x] Test `findDuplicate`: matching is case-insensitive on name
   - [x] Test `findDuplicate`: returns undefined when no match
   - [x] Test `findDuplicate`: does not match when only some fields match (same name but different type)

6. **Write tests for storage layer**
   - [x] Create `src/lib/storage.test.ts`
   - [x] Configure `fake-indexeddb` in test setup
   - [x] Test `addBottle` stores a bottle and returns its id
   - [x] Test `getBottle` retrieves the correct bottle by id
   - [x] Test `getBottle` returns undefined for non-existent id
   - [x] Test `getAllBottles` returns all stored bottles
   - [x] Test `getAllBottles` returns empty array when no bottles exist
   - [x] Test `updateBottle` modifies an existing bottle
   - [x] Test `deleteBottle` removes a bottle
   - [x] Test `clearAll` removes all bottles
