# Feature: Autocomplete for Duplicate Prevention

Plan created at 2026-02-15

## Goal

Add name-based autocomplete to the Add Bottle form so users can quickly find and select existing bottles. When an existing bottle is selected, the form auto-fills with its data and restricts editing to history-entry fields (quantity, price, notes). Editing the name, vintage, or type fields re-triggers duplicate detection, allowing the user to either match a different existing bottle or create a new one. This prevents accidental duplicates while streamlining the add-bottle workflow.

## Acceptance criterias

- [x] Test: typing 2+ characters in the name field displays a dropdown of matching bottles (case-insensitive "contains" match)
- [x] Test: selecting a bottle from the autocomplete dropdown auto-fills form fields (type, vintage, country, region, grape variety, location, rating, notes)
- [x] Test: an info banner is displayed when an existing bottle is selected, showing the bottle name, vintage, and current quantity
- [x] Test: when an existing bottle is selected, only history-entry fields (quantity, price, currency, purchase notes) are editable; other fields (country, region, grape variety, location, rating, bottle notes) are read-only
- [x] Test: name, vintage, and type fields remain editable and changing them re-triggers duplicate detection
- [x] Test: if name+vintage+type no longer match any existing bottle after editing, the form returns to "new bottle" mode (all fields editable, info banner removed)
- [x] Test: if name+vintage+type match a different existing bottle after editing, that bottle is selected and form is auto-filled
- [x] Test: submitting with an existing bottle selected adds a history entry to that bottle (no new bottle created)
- [x] Test: submitting without an existing bottle selected creates a new bottle
- [x] Test: autocomplete dropdown shows "No matches" or closes when fewer than 2 characters are typed
- [x] Test: autocomplete dropdown is keyboard-accessible (arrow keys to navigate, Enter to select, Escape to close)
- [x] Test: duplicate rule remains type + vintage + name (case-insensitive)
- [x] All tests pass (354/354)
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected (no new dependencies added)
- [x] Key decisions from the user are documented (docs/decisions/20260215-autocomplete-duplicate-prevention.md)
- [x] Documentation is up-to-date and coherent
- [x] `ROADMAP.md` is updated
- [x] `CHANGELOG.md` is updated

## Out of scope

- **Autocomplete on other fields (country, region, grape variety)**: Exists as a separate backlog item. This plan only covers name-based autocomplete for duplicate prevention.
- **Fuzzy/phonetic matching**: Only simple case-insensitive "contains" matching. No Levenshtein distance or soundex.
- **External wine database lookup**: Autocomplete only searches existing bottles in the local cellar.
- **New dependencies**: No external autocomplete library. Implement with a custom Svelte component given the simple requirements (~100 bottles max).

## Implementation Steps

1. **Create autocomplete search utility** ✅
   - [x] Add `searchBottlesByName(bottles: readonly Bottle[], query: string): Bottle[]` to `bottle-utils.ts`
   - [x] Implement case-insensitive "contains" matching on the `name` field
   - [x] Return matching bottles sorted alphabetically by name
   - [x] Return empty array if query is fewer than 2 characters
   - [x] Write unit tests: match found, no match, case-insensitive, partial match, short query returns empty, empty bottle list

2. **Create NameAutocomplete component** ✅
   - [x] Create `src/views/NameAutocomplete.svelte` component
   - [x] Props: `value` (string), `bottles` (readonly Bottle[]), `oninput` (callback for text changes), `onselect` (callback when bottle selected), `error` (optional string), `disabled` (boolean)
   - [x] Render a text input wrapped in `FormField` with a dropdown list of matching bottles
   - [x] Each dropdown item shows bottle name, vintage, type badge, and current quantity
   - [x] Show dropdown when input is focused and query has 2+ characters with matches
   - [x] Hide dropdown on blur (with delay for click), Escape key, or when query is cleared
   - [x] Keyboard navigation: arrow keys to move selection, Enter to select, Escape to close
   - [x] Write component tests: renders input, shows dropdown on typing, selects bottle on click, keyboard navigation, hides on escape, shows nothing for short queries

3. **Add duplicate info banner component** ✅
   - [x] Create an info banner section in `AddBottle.svelte` (not a separate component — keep it inline like the existing duplicate banner)
   - [x] Display when an existing bottle is selected: bottle name, vintage, type, and current quantity
   - [x] Style with blue/info color scheme (distinct from the existing amber duplicate-confirmation banner)
   - [x] Include a "Clear selection" button to reset to new-bottle mode
   - [x] Write component test: banner visible when existing bottle selected, hidden when not, clear button works

4. **Integrate autocomplete into AddBottle form** ✅
   - [x] Replace the name text input with the `NameAutocomplete` component
   - [x] Load all bottles on component mount via `getAllBottles()`
   - [x] When a bottle is selected from autocomplete: store it as `selectedBottle` state, auto-fill form fields, show info banner
   - [x] Make non-key fields read-only when `selectedBottle` is set: country, region, grape variety, location, rating, bottle notes
   - [x] Keep name, vintage, type, and history fields (quantity, price, currency, purchase notes) editable

5. **Implement reactive duplicate re-detection** ✅
   - [x] When name, vintage, or type fields change and `selectedBottle` is set, re-run `findDuplicate()` against all bottles
   - [x] If match found and it's a different bottle: update `selectedBottle`, re-fill form fields
   - [x] If match found and it's the same bottle: no change
   - [x] If no match found: clear `selectedBottle`, make all fields editable again, remove info banner
   - [x] Write tests: editing name clears selection when no match, editing type matches different bottle, editing vintage clears selection

6. **Update form submission logic** ✅
   - [x] If `selectedBottle` is set on submit: create history entry from form data and add to existing bottle (reuse existing `confirmDuplicate` logic)
   - [x] If `selectedBottle` is not set: create new bottle (existing `handleSubmit` logic)
   - [x] Remove or bypass the old post-submit duplicate detection banner (replaced by the proactive autocomplete flow)
   - [x] Write integration tests: submit with selected bottle updates existing, submit without creates new

7. **Verify all acceptance criterias** ✅
   - [x] Run full test suite and verify all tests pass (354/354 tests pass)
   - [x] Verify coding style (lint, format)
   - [x] Verify no new dependencies added
   - [x] Verify bundle size is within limits

8. **Update ROADMAP.md** ✅
   - [x] Mark Step 10 as done

9. **Update CHANGELOG.md** ✅
   - [x] Add entry describing the autocomplete feature
