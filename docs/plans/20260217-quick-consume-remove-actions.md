# Feature Quick Consume/Remove Actions

Plan created at 2026-02-17

## Goal

Allow users to quickly consume or remove bottles from their cellar. A "consume 1" and "remove 1" button will be added directly on BottleCard (dashboard and search views) as small icon buttons for fast single-bottle actions. The same actions will be available in the BottleDetail modal. Both actions create a history entry (consumed/removed), update IndexedDB, and sync to GitHub. No confirmation dialog, no notes field — optimized for speed. Buttons are hidden when current stock is 0.

## Status: DONE

## Acceptance criterias

- [x] BottleCard displays a consume icon button (-1) and a remove icon button (x) when quantity > 0
- [x] BottleCard hides consume and remove buttons when quantity is 0
- [x] Clicking consume on BottleCard creates a "consumed" history entry with quantity 1 and today's date
- [x] Clicking remove on BottleCard creates a "removed" history entry with quantity 1 and today's date
- [x] After consume/remove on BottleCard, the bottle's displayed quantity decreases by 1
- [x] After consume/remove on BottleCard, IndexedDB is updated via `updateBottle()`
- [x] After consume/remove on BottleCard, GitHub sync is triggered via `attemptSync()`
- [x] A success toast is shown after consume (e.g., "Consumed 1x Château Margaux 2015")
- [x] A success toast is shown after remove (e.g., "Removed 1x Château Margaux 2015")
- [x] BottleDetail modal displays consume and remove buttons when quantity > 0
- [x] BottleDetail modal hides consume and remove buttons when quantity is 0
- [x] Consume/remove from BottleDetail updates the detail view (quantity and history timeline)
- [x] Clicking consume/remove on BottleCard does NOT open the BottleDetail modal (event propagation stopped)
- [x] All tests pass
- [x] Coding style requirements are respected (components under 150 lines, single responsibility)
- [x] Testing requirements are respected (happy path, failure cases, edge cases)
- [x] Dependency management requirements are respected (no new dependencies)
- [x] Key decisions are documented
- [x] Documentation is up-to-date and coherent
- [x] ROADMAP.md is updated
- [x] CHANGELOG.md is updated

## Out of scope

- **Custom quantity input**: Only single-bottle (quantity 1) actions. Bulk consume/remove with a quantity picker is deferred for simplicity.
- **Notes on consume/remove**: No notes field on quick actions. History entries will have no notes. Adding notes can be considered later.
- **Confirmation dialogs**: No confirmation step. Actions are immediate with toast feedback. Reversibility is manual (add the bottle back).
- **Undo functionality**: No undo button on toast. If consumed/removed by mistake, user must add the bottle back manually.
- **History entry editing/deletion**: History remains append-only.

## Implementation Steps

1. Create history entry helper functions
- [x] Add `createConsumeHistoryEntry(): HistoryEntry` function in `src/lib/bottle-utils.ts` that returns `{ date: today, action: HistoryAction.Consumed, quantity: 1 }`
- [x] Add `createRemoveHistoryEntry(): HistoryEntry` function in `src/lib/bottle-utils.ts` that returns `{ date: today, action: HistoryAction.Removed, quantity: 1 }`
- [x] Add `applyHistoryEntry(bottle: Bottle, entry: HistoryEntry): Bottle` function that returns a new Bottle with the entry appended to history
- [x] Write unit tests for these helper functions (happy path, edge cases)

2. Create a reusable consume/remove action handler
- [x] Add `consumeBottle(bottle: Bottle): Promise<Bottle>` in `src/lib/bottle-actions.ts` — creates entry, updates IndexedDB, triggers sync, shows toast, returns updated bottle
- [x] Add `removeBottle(bottle: Bottle): Promise<Bottle>` in `src/lib/bottle-actions.ts` — same flow but with "removed" action
- [x] Both functions use `$state.snapshot()` pattern (or accept a plain object) to avoid Svelte proxy issues with IndexedDB
- [x] Write unit tests for the action handlers (mocking storage and sync)

3. Add consume/remove buttons to BottleCard
- [x] Add small icon buttons for consume (-) and remove (x) on the BottleCard
- [x] Buttons are only rendered when `calculateQuantity(bottle.history) > 0`
- [x] Use `event.stopPropagation()` to prevent the card's onclick (detail modal) from firing
- [x] Call the action handlers from step 2 on click
- [x] After action, emit an `onupdate` callback so parent views can refresh data
- [x] Add a new `onupdate?: (bottle: Bottle) => void` prop to BottleCard
- [x] Style buttons: consume in orange/amber, remove in red, small and unobtrusive
- [x] Add `data-testid` attributes for consume and remove buttons
- [x] Write component tests: buttons visible when quantity > 0, hidden when 0, click calls handler, stopPropagation works

4. Add consume/remove buttons to BottleDetail
- [x] Add consume and remove buttons in the BottleDetail modal (near the quantity display)
- [x] Buttons are only rendered when quantity > 0
- [x] Call the action handlers from step 2 on click
- [x] After action, update `currentBottle` state so the detail view refreshes (quantity and history)
- [x] Emit `onupdate` callback so parent views can refresh data
- [x] Add `data-testid` attributes for consume and remove buttons
- [x] Write component tests: buttons visible/hidden based on quantity, click updates view

5. Update Dashboard and Search to handle bottle updates from BottleCard
- [x] Pass `onupdate` handler to BottleCard in Dashboard — reloads bottle list
- [x] Pass `onupdate` handler to BottleCard in Search — reloads bottle list
- [x] Ensure the updated bottle is reflected immediately in the view
- [x] Write integration tests: consume from dashboard card updates quantity, consume from search card updates quantity

6. Write comprehensive tests
- [x] Unit tests for `createConsumeHistoryEntry` and `createRemoveHistoryEntry`
- [x] Unit tests for `applyHistoryEntry`
- [x] Unit tests for `consumeBottle` and `removeBottle` action handlers
- [x] Component tests for BottleCard consume/remove buttons (visible/hidden, click behavior, stopPropagation)
- [x] Component tests for BottleDetail consume/remove buttons (visible/hidden, click updates view)
- [x] Integration tests for Dashboard (consume from card, quantity updates)
- [x] Integration tests for Search (consume from card, quantity updates)
- [x] Edge case: consuming when quantity is exactly 1 should hide buttons after action
- [x] Edge case: verify `$state.snapshot()` is used before IndexedDB writes

7. Verify all acceptance criterias
- [x] Run full test suite and confirm all tests pass
- [x] Verify coding style (component size, naming conventions, TypeScript strict mode)
- [x] Verify no new dependencies were added
- [x] Manual smoke test: consume from BottleCard, consume from BottleDetail, verify quantity updates and history

8. Update ROADMAP.md
- [x] Mark Step 14 as complete with checkmarks on all sub-items

9. Update CHANGELOG.md
- [x] Add entry for quick consume/remove actions
