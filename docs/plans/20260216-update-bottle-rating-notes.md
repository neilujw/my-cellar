# Feature Update Bottle Rating & Notes

Plan created at 2026-02-16

## Status: Complete ✅

## Goal

Allow users to view full bottle details and edit non-key bottle fields (rating, notes, location, grape variety, country, region). Tapping a BottleCard opens a full-page detail modal showing all bottle information and history. From the detail view, an Edit button opens an edit modal overlay with key fields (name, vintage, type) visible but disabled and all other fields editable. Changes are saved to IndexedDB and synced to GitHub.

## Acceptance criterias

- [x] Tapping a BottleCard on Dashboard opens a full-page detail modal showing all bottle fields and full history
- [x] Tapping a BottleCard on Search results opens the same detail modal
- [x] Detail modal displays: name, vintage, type, country, region, grape varieties, location, rating, notes, and full history timeline
- [x] Detail modal has a close button to dismiss it
- [x] Detail modal has an Edit button that opens an edit modal overlay
- [x] Edit modal shows name, vintage, and type as visible but disabled (read-only) fields
- [x] Edit modal shows rating, notes, location, grape variety, country, and region as editable fields
- [x] Edit modal pre-fills all fields with current bottle values
- [x] Country and region fields in edit modal have autocomplete (reuse TextAutocomplete)
- [x] Grape variety field in edit modal uses tag input (reuse GrapeTagInput)
- [x] Rating validation: optional, must be between 1 and 10 if provided
- [x] Saving edit updates the bottle in IndexedDB via `updateBottle()`
- [x] Saving edit triggers GitHub sync via `attemptSync()`
- [x] After saving, the detail modal reflects the updated values
- [x] A success toast is shown after saving
- [x] Edit modal has a Cancel button that discards changes and closes the modal
- [x] All tests pass
- [x] Coding style requirements are respected (components under 150 lines, single responsibility)
- [x] Testing requirements are respected (happy path, failure cases, edge cases)
- [x] Dependency management requirements are respected (no new dependencies)
- [x] Key decisions are documented
- [x] Documentation is up-to-date and coherent
- [x] ROADMAP.md is updated
- [x] CHANGELOG.md is updated

## Out of scope

- **Editing key fields (name, vintage, type)**: These are used for duplicate detection and file path generation. Allowing edits would require duplicate re-validation and file renaming logic, which adds significant complexity. Deferred to backlog.
- **Consume/Remove actions from detail view**: This is Step 14's scope. The detail view will not include consume/remove buttons yet.
- **Drinking window field**: This is Step 15's scope. The edit form will not include a consumeStartingFrom field.
- **History editing/deletion**: History entries are append-only. No ability to edit or delete past history entries.

## Implementation Steps

1. Create BottleDetail component (full-page modal) ✅
- [x] Create `src/views/BottleDetail.svelte` as a full-page modal overlay
- [x] Display all bottle fields: name, vintage, type badge, country, region, grape varieties, location, rating, notes
- [x] Display full history timeline (date, action, quantity, price, notes for each entry)
- [x] Add close button (X) in the top-right corner to dismiss the modal
- [x] Add Edit button in the header or as a prominent action
- [x] Add `data-testid` attributes for all displayed elements
- [x] Keep component under 150 lines; extract history timeline to a sub-component if needed

2. Make BottleCard clickable ✅
- [x] Add `onclick` handler to BottleCard that emits a callback with the bottle
- [x] Update Dashboard.svelte to handle BottleCard click → open BottleDetail modal
- [x] Update Search.svelte to handle BottleCard click → open BottleDetail modal
- [x] Ensure the card has appropriate cursor and focus styles for accessibility

3. Create EditBottle modal component ✅
- [x] Create `src/views/EditBottle.svelte` as a modal overlay
- [x] Show name, vintage, and type as disabled fields (visible for context)
- [x] Show editable fields: rating (number input, 1-10, optional), notes (textarea), location (text input), country (TextAutocomplete), region (TextAutocomplete), grape variety (GrapeTagInput)
- [x] Pre-fill all fields with current bottle values
- [x] Add Save and Cancel buttons
- [x] Implement form validation (rating range 1-10 if provided)
- [x] On Save: create updated Bottle object (spread existing + new field values), call `updateBottle()`, call `attemptSync()`, show success toast, close modal
- [x] On Cancel: discard changes, close modal
- [x] Add `data-testid` attributes for all form fields and buttons

4. Wire edit flow together ✅
- [x] BottleDetail Edit button opens EditBottle modal, passing the current bottle
- [x] After EditBottle saves, BottleDetail receives updated bottle and refreshes its display
- [x] After EditBottle saves, Dashboard/Search re-fetch bottles to reflect changes

5. Write unit and component tests ✅
- [x] Test BottleDetail renders all bottle fields correctly
- [x] Test BottleDetail renders full history timeline
- [x] Test BottleDetail close button dismisses the modal
- [x] Test BottleDetail Edit button opens the edit modal
- [x] Test EditBottle pre-fills all fields with bottle values
- [x] Test EditBottle key fields are disabled
- [x] Test EditBottle saving calls `updateBottle()` and `attemptSync()`
- [x] Test EditBottle rating validation (empty allowed, out of range rejected)
- [x] Test EditBottle Cancel discards changes
- [x] Test BottleCard click handler fires with correct bottle
- [x] Test Dashboard opens detail modal on BottleCard click
- [x] Test Search opens detail modal on BottleCard click

6. Verify all acceptance criterias ✅
- [x] Run full test suite and confirm all tests pass
- [x] Verify coding style (component size, naming conventions, TypeScript strict mode)
- [x] Verify no new dependencies were added
- [x] Manual smoke test of the full flow: BottleCard → Detail → Edit → Save → verify update

7. Update ROADMAP.md ✅
- [x] Mark Step 13 as complete with checkmarks on all sub-items

8. Update CHANGELOG.md ✅
- [x] Add entry for bottle detail view and edit functionality
