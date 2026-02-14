# Feature Add Bottle

Plan created at 2026-02-14

## Goal

Implement the Add Bottle form view, allowing users to add new wines to their cellar. The form collects all bottle fields (name, vintage, type, country, region, grape varieties, location, rating, notes) plus the initial history entry (quantity, price, notes). When a duplicate is detected (same type + vintage + name), the user is shown a confirmation banner to merge the new quantity into the existing bottle's history. After a successful add, the user is redirected to the dashboard.

## Acceptance criterias

- [x] Form displays all required fields: name, vintage, type (dropdown), country, region, quantity (default 1)
- [x] Form displays all optional fields: grape variety (tag input), location, rating (1-10), notes, price (amount + currency with EUR default), history notes
- [x] Required fields are validated: name non-empty, vintage is a valid year (1900-2099), type is selected, country non-empty, region non-empty, quantity >= 1
- [x] Optional field validation: rating between 1-10 when provided, price amount > 0 when provided
- [x] Grape variety input works as free-text tags: Enter/comma adds a tag, tags are removable individually
- [x] On submit, duplicate detection runs against existing bottles (type + vintage + name, case-insensitive)
- [x] When no duplicate found: a new bottle is created with a UUID, saved to IndexedDB, and user navigates to dashboard
- [x] When duplicate found: a confirmation banner is displayed showing the matched bottle name/vintage, with "Confirm" and "Cancel" buttons
- [x] When duplicate confirmed: a new history entry is appended to the existing bottle in IndexedDB, and user navigates to dashboard
- [x] When duplicate cancelled: the user stays on the form to modify their input
- [x] Form is mobile-optimized with responsive layout and touch-friendly inputs
- [x] All new utility functions have unit tests
- [x] AddBottle component has integration tests verifying: form rendering, validation errors, successful add, duplicate detection flow, duplicate confirmation, and navigation
- [x] All tests pass
- [x] Coding style requirements are respected (component < 150 lines, TypeScript strict, JSDoc, etc.)
- [x] Testing requirements are respected (AAA pattern, happy path + edge cases, descriptive names)
- [x] Dependency management requirements are respected (no new dependencies needed)
- [x] Key decisions from the user are documented
- [x] `ROADMAP.md` is updated when all the implementation steps are done
- [x] `CHANGELOG.md` is updated when all the implementation steps are done

## Out of scope

- Consume/remove actions: The form only handles adding bottles. Consuming and removing will be implemented as part of a future step (likely from search results or a bottle detail view).
- Editing existing bottles: No edit mode. Users can only add new bottles or merge quantity into existing ones.
- Auto-complete for country/region: No suggestion lists. Free text input only.
- Grape variety predefined list: No database of grape varieties. Free-text tags only.
- Camera/barcode input: Per PROJECT.md, manual entry only.

## Implementation Steps

1. Create form validation utility (`src/lib/form-utils.ts`) ✅
   - [x] Define `FormData` interface with all form fields (string-based for input binding)
   - [x] Define `FormErrors` type mapping field names to error messages
   - [x] Implement `validateForm(data: FormData): FormErrors` — returns empty object if valid, field-to-message map if invalid
   - [x] Implement `createBottleFromForm(data: FormData): Bottle` — converts validated form data to a `Bottle` with generated UUID and initial history entry
   - [x] Implement `createHistoryEntryFromForm(data: FormData): HistoryEntry` — creates a history entry from form data (for duplicate merge)
   - [x] Unit tests for all functions in `src/lib/form-utils.test.ts` covering: valid data, missing required fields, invalid vintage, invalid rating, invalid quantity, price handling, grape variety parsing, history entry creation

2. Implement AddBottle component (`src/views/AddBottle.svelte`) ✅
   - [x] Form layout with all fields grouped logically: Wine details (name, vintage, type), Origin (country, region), Characteristics (grape variety tags, rating), Storage (location), Purchase (quantity, price amount, price currency), Notes (bottle notes, history notes)
   - [x] Bind form inputs to reactive state using Svelte 5 runes
   - [x] Grape variety tag input: text input that adds tags on Enter/comma keypress, display tags with remove button (extracted to `GrapeTagInput.svelte`)
   - [x] Type selector as `<select>` with WineType enum values
   - [x] Display inline validation errors below each field on submit attempt (extracted `FormField.svelte`)
   - [x] On submit: validate form, check for duplicates, create bottle or show confirmation banner
   - [x] Duplicate confirmation banner: shows matched bottle info, "Confirm" appends history entry, "Cancel" dismisses banner
   - [x] On successful save: call `navigate('/')` to return to dashboard
   - [x] Keep component under 150 lines by delegating validation and bottle creation to `form-utils.ts`
   - [x] Mobile-first layout with Tailwind CSS, touch-friendly input sizing
   - [x] Add `data-testid` attributes for testable elements

3. Write AddBottle component tests (`src/views/AddBottle.test.ts`) ✅
   - [x] Test form renders all required and optional fields
   - [x] Test validation errors display when submitting empty required fields
   - [x] Test successful bottle creation with valid data (mock `storage.addBottle`, verify navigation)
   - [x] Test duplicate detection shows confirmation banner (mock `storage.getAllBottles` with matching bottle)
   - [x] Test confirming duplicate merge appends history entry (mock `storage.updateBottle`)
   - [x] Test cancelling duplicate dismisses banner and keeps form
   - [x] Test grape variety tag input: adding tags, removing tags
   - [x] Test optional fields (rating, location, price) can be left empty
   - [x] Test price defaults to EUR currency
   - [x] Mock storage functions to avoid real IndexedDB in tests

4. Update ROADMAP.md ✅
   - [x] Mark Step 4 items as done

5. Update CHANGELOG.md ✅
   - [x] Add entry for Add Bottle feature

6. Commit changes
   - [ ] Commit all changes with descriptive message (pending user request)
