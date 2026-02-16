# Feature: Autocomplete for Country & Region

Plan created at 2026-02-16

## Goal

Add autocomplete dropdowns to the Country and Region fields in the Add Bottle form. Suggestions are sourced from existing bottles in the cellar (no static/external data). The dropdown shows all matching values on focus and filters as the user types. A generic reusable `TextAutocomplete` component is created and used for both fields. Free-text entry remains allowed for new values not yet in the cellar.

## Acceptance criterias

- [ ] Test: focusing the Country field displays a dropdown of all unique countries from existing bottles
- [ ] Test: focusing the Region field displays a dropdown of all unique regions from existing bottles
- [ ] Test: typing in the Country field filters suggestions (case-insensitive "contains" match)
- [ ] Test: typing in the Region field filters suggestions (case-insensitive "contains" match)
- [ ] Test: selecting a suggestion from the dropdown fills the field value
- [ ] Test: free-text entry is allowed (user can type a value not in the suggestion list)
- [ ] Test: dropdown closes on blur, Escape key, or when a suggestion is selected
- [ ] Test: dropdown is keyboard-accessible (arrow keys to navigate, Enter to select, Escape to close)
- [ ] Test: dropdown shows "No matches" when input text doesn't match any suggestion
- [ ] Test: dropdown shows nothing when suggestion list is empty (no bottles in cellar)
- [ ] Test: Country and Region fields remain read-only when an existing bottle is selected (existing behavior preserved)
- [ ] Test: TextAutocomplete component has proper ARIA attributes (combobox role, listbox, aria-expanded, aria-activedescendant)
- [ ] All tests pass
- [ ] Coding style requirements are respected
- [ ] Testing requirements are respected
- [ ] Dependency management requirements are respected (no new dependencies)
- [ ] Key decisions from the user are documented
- [ ] Documentation is up-to-date and coherent
- [ ] `ROADMAP.md` is updated
- [ ] `CHANGELOG.md` is updated

## Out of scope

- **Grape Varieties autocomplete**: User decided to keep the current free-text `GrapeTagInput` as-is. Removed from Step 12 scope entirely.
- **Static/external suggestion lists**: No built-in list of countries, regions, or grape varieties. Suggestions come only from existing bottles.
- **Fuzzy/phonetic matching**: Simple case-insensitive "contains" matching only.
- **New dependencies**: Custom Svelte component, no external autocomplete library needed.
- **Region filtering by country**: Region suggestions are not filtered based on the selected country. All unique regions are shown regardless.

## Implementation Steps

1. **Create generic TextAutocomplete component**
   - [ ] Create `src/views/TextAutocomplete.svelte` component
   - [ ] Props: `value` (string), `suggestions` (readonly string[]), `oninput` (callback for text changes), `label` (string), `id` (string), `error` (optional string), `disabled` (boolean), `placeholder` (optional string), `required` (boolean)
   - [ ] Compute filtered suggestions: case-insensitive "contains" match on input value; show all when value is empty
   - [ ] Show dropdown on focus (if suggestions exist), filter while typing
   - [ ] Each dropdown item shows the suggestion string, with the matching portion highlighted
   - [ ] Keyboard navigation: arrow keys to move selection, Enter to select, Escape to close
   - [ ] Hide dropdown on blur (with 200ms delay for click), Escape, or selection
   - [ ] Proper ARIA attributes: combobox role, listbox, aria-expanded, aria-activedescendant
   - [ ] Show "No matches" when input has text but no suggestions match
   - [ ] Show nothing (no dropdown) when suggestion list is empty
   - [ ] Wrap input in `FormField` component (consistent with existing form fields)
   - [ ] Write unit tests: renders input, shows all suggestions on focus, filters on typing, selects on click, keyboard navigation, hides on escape, no matches message, empty suggestions list, ARIA attributes

2. **Add suggestion extraction utility for search-utils**
   - [ ] Verify `getUniqueCountries()` and `getUniqueRegions()` in `search-utils.ts` work correctly for autocomplete (they already exist and return sorted unique values)
   - [ ] Write unit tests if not already covered: empty bottles list, deduplication, sorting

3. **Integrate TextAutocomplete into AddBottle form**
   - [ ] Replace Country text input with `TextAutocomplete` component, passing `getUniqueCountries(allBottles)` as suggestions
   - [ ] Replace Region text input with `TextAutocomplete` component, passing `getUniqueRegions(allBottles)` as suggestions
   - [ ] Ensure `disabled` prop is passed when `selectedBottle` is set (preserving read-only behavior)
   - [ ] Verify form validation still works (country and region remain required fields)
   - [ ] Write integration tests: autocomplete shows country suggestions, autocomplete shows region suggestions, selecting suggestion fills field, fields are read-only when bottle is selected

4. **Verify all acceptance criterias**
   - [ ] Run full test suite and verify all tests pass
   - [ ] Verify coding style (lint, format)
   - [ ] Verify no new dependencies added

5. **Update ROADMAP.md**
   - [ ] Update Step 12 description to reflect actual scope (Country and Region only, no Grape Varieties)
   - [ ] Mark Step 12 as done

6. **Update CHANGELOG.md**
   - [ ] Add entry describing the autocomplete feature for Country and Region fields
