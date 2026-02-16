# Feature: Autocomplete for Country & Region

Plan created at 2026-02-16

## Goal

Add autocomplete dropdowns to the Country and Region fields in the Add Bottle form. Suggestions are sourced from existing bottles in the cellar (no static/external data). The dropdown shows all matching values on focus and filters as the user types. A generic reusable `TextAutocomplete` component is created and used for both fields. Free-text entry remains allowed for new values not yet in the cellar.

## Acceptance criterias

- [x] Test: focusing the Country field displays a dropdown of all unique countries from existing bottles
- [x] Test: focusing the Region field displays a dropdown of all unique regions from existing bottles
- [x] Test: typing in the Country field filters suggestions (case-insensitive "contains" match)
- [x] Test: typing in the Region field filters suggestions (case-insensitive "contains" match)
- [x] Test: selecting a suggestion from the dropdown fills the field value
- [x] Test: free-text entry is allowed (user can type a value not in the suggestion list)
- [x] Test: dropdown closes on blur, Escape key, or when a suggestion is selected
- [x] Test: dropdown is keyboard-accessible (arrow keys to navigate, Enter to select, Escape to close)
- [x] Test: dropdown shows "No matches" when input text doesn't match any suggestion
- [x] Test: dropdown shows nothing when suggestion list is empty (no bottles in cellar)
- [x] Test: Country and Region fields remain read-only when an existing bottle is selected (existing behavior preserved)
- [x] Test: TextAutocomplete component has proper ARIA attributes (combobox role, listbox, aria-expanded, aria-activedescendant)
- [x] All tests pass
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected (no new dependencies)
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] `ROADMAP.md` is updated
- [x] `CHANGELOG.md` is updated

## Out of scope

- **Grape Varieties autocomplete**: User decided to keep the current free-text `GrapeTagInput` as-is. Removed from Step 12 scope entirely.
- **Static/external suggestion lists**: No built-in list of countries, regions, or grape varieties. Suggestions come only from existing bottles.
- **Fuzzy/phonetic matching**: Simple case-insensitive "contains" matching only.
- **New dependencies**: Custom Svelte component, no external autocomplete library needed.
- **Region filtering by country**: Region suggestions are not filtered based on the selected country. All unique regions are shown regardless.

## Implementation Steps

1. **Create generic TextAutocomplete component**
   - [x] Create `src/views/TextAutocomplete.svelte` component
   - [x] Props: `value` (string), `suggestions` (readonly string[]), `oninput` (callback for text changes), `label` (string), `id` (string), `error` (optional string), `disabled` (boolean), `placeholder` (optional string), `required` (boolean)
   - [x] Compute filtered suggestions: case-insensitive "contains" match on input value; show all when value is empty
   - [x] Show dropdown on focus (if suggestions exist), filter while typing
   - [x] Each dropdown item shows the suggestion string, with the matching portion highlighted
   - [x] Keyboard navigation: arrow keys to move selection, Enter to select, Escape to close
   - [x] Hide dropdown on blur (with 200ms delay for click), Escape, or selection
   - [x] Proper ARIA attributes: combobox role, listbox, aria-expanded, aria-activedescendant
   - [x] Show "No matches" when input has text but no suggestions match
   - [x] Show nothing (no dropdown) when suggestion list is empty
   - [x] Wrap input in `FormField` component (consistent with existing form fields)
   - [x] Write unit tests: renders input, shows all suggestions on focus, filters on typing, selects on click, keyboard navigation, hides on escape, no matches message, empty suggestions list, ARIA attributes

2. **Add suggestion extraction utility for search-utils**
   - [x] Verify `getUniqueCountries()` and `getUniqueRegions()` in `search-utils.ts` work correctly for autocomplete (they already exist and return sorted unique values)
   - [x] Write unit tests if not already covered: empty bottles list, deduplication, sorting

3. **Integrate TextAutocomplete into AddBottle form**
   - [x] Replace Country text input with `TextAutocomplete` component, passing `getUniqueCountries(allBottles)` as suggestions
   - [x] Replace Region text input with `TextAutocomplete` component, passing `getUniqueRegions(allBottles)` as suggestions
   - [x] Ensure `disabled` prop is passed when `selectedBottle` is set (preserving read-only behavior)
   - [x] Verify form validation still works (country and region remain required fields)
   - [x] Write integration tests: autocomplete shows country suggestions, autocomplete shows region suggestions, selecting suggestion fills field, fields are read-only when bottle is selected

4. **Verify all acceptance criterias**
   - [x] Run full test suite and verify all tests pass
   - [x] Verify coding style (lint, format)
   - [x] Verify no new dependencies added

5. **Update ROADMAP.md**
   - [x] Update Step 12 description to reflect actual scope (Country and Region only, no Grape Varieties)
   - [x] Mark Step 12 as done

6. **Update CHANGELOG.md**
   - [x] Add entry describing the autocomplete feature for Country and Region fields
