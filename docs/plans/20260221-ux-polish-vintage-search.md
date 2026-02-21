# Feature: UX Polish — Vintage & Search

Plan created at 2026-02-21

## Status: Done

## Goal

Improve UX in three areas: (1) allow "no vintage" wines by accepting vintage value 0 via a checkbox in the Add Bottle form, displaying "N/A" everywhere instead of 0; (2) implement accent-insensitive text matching across name search, country/region filters, and duplicate detection so that "e" matches "é" and vice versa; (3) ensure vintage range filters and sorting handle no-vintage bottles correctly.

## Acceptance criterias

- [x] Add Bottle form has a "No vintage" checkbox that disables the vintage input and sets vintage to 0
- [x] Validation accepts vintage 0 (no vintage) alongside the existing 1900–2099 range
- [x] When vintage is 0, "N/A" is displayed instead of 0 on BottleCard, BottleDetail, Dashboard recent activity, and AddBottle existing-bottle banner
- [x] Duplicate detection treats vintage=0 as a valid matching value (two NV bottles with same name+type are duplicates)
- [x] "consumeStartingFrom < vintage" cross-validation is skipped when vintage is 0
- [x] Name search in Search view is accent-insensitive (e.g., searching "chateau" matches "Château")
- [x] Country filter comparison is accent-insensitive (e.g., filter value "Espana" matches bottle country "España")
- [x] Region filter comparison is accent-insensitive
- [x] Duplicate detection name comparison is accent-insensitive
- [x] No-vintage bottles are excluded from vintage range filters (vintageMin/vintageMax) — they only appear when no vintage filter is active
- [x] Sorting by vintage places no-vintage bottles (0) at the end
- [x] All existing tests still pass
- [x] New unit tests cover: vintage=0 validation, "N/A" display helper, accent normalization utility, accent-insensitive filtering, accent-insensitive duplicate detection, vintage=0 edge cases in filters/sorting
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] ROADMAP.md is updated
- [x] CHANGELOG.md is updated

## Out of scope

- Editing key fields (name, vintage, type) in the Edit Bottle modal: already in backlog, separate concern
- Debouncing search input: not requested, current keystroke filtering is acceptable
- Full-text search across multiple fields (notes, region, etc.): only name search exists today, expanding it is a separate feature

## Implementation Steps

1. **Create accent normalization utility** (`src/lib/text-utils.ts`)
   - [x] Create `normalizeAccents(text: string): string` function using `String.prototype.normalize('NFD')` + regex to strip combining diacritical marks
   - [x] Create `accentInsensitiveIncludes(haystack: string, needle: string): boolean` helper that normalizes both strings before case-insensitive comparison
   - [x] Create `accentInsensitiveEquals(a: string, b: string): boolean` helper for exact match comparisons (country/region filters)
   - [x] Write unit tests for normalizeAccents, accentInsensitiveIncludes, accentInsensitiveEquals with edge cases (empty strings, mixed accents, already-ASCII text)

2. **Create vintage display helper** (`src/lib/bottle-utils.ts`)
   - [x] Add `formatVintage(vintage: number): string` function that returns `'N/A'` for `0` and the number as string otherwise
   - [x] Write unit tests for formatVintage (0 → "N/A", normal year → year string)

3. **Update form validation for vintage 0** (`src/lib/form-utils.ts`)
   - [x] Modify `validateForm` to accept vintage `0` as valid (skip range check when value is 0)
   - [x] Skip "consumeStartingFrom < vintage" cross-validation when vintage is 0
   - [x] Update `createBottleFromForm` — no change needed since `Number('0')` already returns `0`
   - [x] Write unit tests: vintage "0" passes validation, consumeStartingFrom with vintage "0" has no cross-validation error

4. **Update Add Bottle form UI** (`src/views/AddBottle.svelte`)
   - [x] Add a "No vintage" checkbox next to the vintage input
   - [x] When checked: disable vintage input, set form vintage to `'0'`
   - [x] When unchecked: enable vintage input, clear vintage field back to `''`
   - [x] When form is pre-filled from duplicate detection and vintage is 0, auto-check the checkbox
   - [x] Display vintage as "N/A" in the existing-bottle info banner when vintage is 0

5. **Update vintage display across all views**
   - [x] `BottleCard.svelte`: use `formatVintage(bottle.vintage)` instead of `{bottle.vintage}`
   - [x] `BottleDetail.svelte`: use `formatVintage(currentBottle.vintage)` instead of `{currentBottle.vintage}`
   - [x] `Dashboard.svelte` recent activity: use `formatVintage(entry.vintage)` instead of `{entry.vintage}`

6. **Apply accent-insensitive matching to search and filters** (`src/lib/search-utils.ts`)
   - [x] Replace `bottle.name.toLowerCase().includes(filters.searchText.toLowerCase())` with `accentInsensitiveIncludes(bottle.name, filters.searchText)`
   - [x] Replace country exact match `bottle.country !== filters.country` with `!accentInsensitiveEquals(bottle.country, filters.country)`
   - [x] Replace region exact match `bottle.region !== filters.region` with `!accentInsensitiveEquals(bottle.region, filters.region)`
   - [x] Write unit tests: accent-insensitive name search, accent-insensitive country/region filter

7. **Apply accent-insensitive matching to duplicate detection** (`src/lib/bottle-utils.ts`)
   - [x] Update `findDuplicate` name comparison to use `accentInsensitiveEquals` instead of plain `toLowerCase()` comparison
   - [x] Write unit tests: duplicate detection matches accented names

8. **Handle vintage 0 in search filters and sorting** (`src/lib/search-utils.ts`)
   - [x] Exclude bottles with `vintage === 0` from vintage range filters (vintageMin/vintageMax)
   - [x] Update `sortBottles` vintage case: place bottles with `vintage === 0` at the end
   - [x] Write unit tests: vintage=0 bottles excluded from range filter, vintage=0 sorted last

9. **Verify all acceptance criterias**
   - [x] Run full test suite
   - [x] Verify coding style (lint, format)
   - [x] Manual smoke test of Add Bottle with "No vintage" checkbox
   - [x] Manual smoke test of search with accented characters

10. **Update ROADMAP.md**
    - [x] Mark Step 17 items as done

11. **Update CHANGELOG.md**
    - [x] Add entry for Step 17: UX Polish — Vintage & Search
