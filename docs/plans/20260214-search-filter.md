# Feature Search & Filter

Plan created at 2026-02-14

## Goal

Implement the Search & Filter view (Roadmap Step 5) so users can browse, search, filter, and sort their wine collection. The view features a text search bar (matching bottle name), a collapsible filter panel (type, country, region, vintage range, minimum rating), user-selectable sorting (name, vintage, rating, quantity, recently added), and a responsive card list showing all bottles with their key details. All filter options are dynamically derived from cellar contents.

## Acceptance criterias

- [x] Text search filters bottles by name (case-insensitive, partial match)
- [x] Type filter shows only bottles matching selected wine type(s)
- [x] Country filter dropdown lists only countries present in the cellar and filters correctly
- [x] Region filter dropdown lists only regions present in the cellar and filters correctly
- [x] Vintage range filter (min/max) filters bottles within the specified range
- [x] Minimum rating filter shows only bottles with rating >= selected value
- [x] Filters combine with AND logic (all active filters must match)
- [x] Collapsible filter panel toggles open/closed and shows active filter count when collapsed
- [x] "Clear filters" button resets all filters and search text
- [x] Sort dropdown allows sorting by: name (default), vintage, rating, quantity, recently added
- [x] Sorting applies correctly in both ascending order (name, vintage) and descending order (rating, quantity, recently added)
- [x] Bottle cards display: name, vintage, type, country, region, current quantity, and rating (if set)
- [x] Bottles with zero quantity are shown (not hidden)
- [x] Empty state displays a message when no bottles match current filters
- [x] Empty state displays a CTA to add first bottle when cellar is empty
- [x] All tests pass
- [x] Coding style requirements are respected (components < 150 lines, single responsibility)
- [x] Testing requirements are respected (happy path, failure cases, edge cases)
- [x] Dependency management requirements are respected (no new dependencies needed)

## Out of scope

- **Bottle detail view**: Cards are read-only; tapping a card does nothing. Detail view is a future feature.
- **Consume/Remove actions**: No inline actions on cards. Already tracked in BACKLOG.md.
- **Search on multiple fields**: Only name is searched. Expanding to other fields is a future enhancement.
- **Saved filters/search history**: No persistence of filter state across navigation.
- **Pagination/virtual scrolling**: Not needed for ~100 bottles. Can be added later if needed.

## Implementation Steps

1. Create search utility module (`src/lib/search-utils.ts`)
   - [x] Define `SearchFilters` interface (searchText, types, country, region, vintageMin, vintageMax, minRating)
   - [x] Define `SortOption` type (`'name' | 'vintage' | 'rating' | 'quantity' | 'recentlyAdded'`)
   - [x] Implement `filterBottles(bottles, filters): Bottle[]` — applies all active filters with AND logic
   - [x] Implement `sortBottles(bottles, sortOption): Bottle[]` — sorts by selected option
   - [x] Implement `getUniqueCountries(bottles): string[]` — extracts sorted unique countries
   - [x] Implement `getUniqueRegions(bottles): string[]` — extracts sorted unique regions
   - [x] Add JSDoc comments for all exported functions

2. Write unit tests for search utilities (`src/lib/search-utils.test.ts`)
   - [x] Test text search: case-insensitive partial match on name
   - [x] Test text search: empty search text returns all bottles
   - [x] Test type filter: single type, multiple types, no type selected
   - [x] Test country filter: matches exact country, empty filter returns all
   - [x] Test region filter: matches exact region, empty filter returns all
   - [x] Test vintage range filter: min only, max only, both min and max, no range
   - [x] Test minimum rating filter: filters correctly, unrated bottles excluded when filter active
   - [x] Test combined filters: multiple filters applied with AND logic
   - [x] Test sort by name (alphabetical ascending)
   - [x] Test sort by vintage (ascending)
   - [x] Test sort by rating (descending, unrated bottles last)
   - [x] Test sort by quantity (descending)
   - [x] Test sort by recently added (most recent history entry first)
   - [x] Test getUniqueCountries and getUniqueRegions return sorted unique values

3. Create BottleCard component (`src/views/BottleCard.svelte`)
   - [x] Accept a `Bottle` prop
   - [x] Display: name, vintage, type badge (colored), country — region, current quantity, rating (if set)
   - [x] Use `calculateQuantity` from `bottle-utils.ts` for quantity
   - [x] Mobile-friendly card layout with Tailwind styling
   - [x] Add appropriate test-id attributes (`bottle-card`, `bottle-card-name`, `bottle-card-quantity`, etc.)

4. Create FilterPanel component (`src/views/FilterPanel.svelte`)
   - [x] Accept props: current filters, available countries, available regions, onchange callback
   - [x] Collapsible panel with toggle button showing active filter count
   - [x] Type filter: checkboxes or toggle buttons for each WineType
   - [x] Country filter: `<select>` dropdown with dynamic options
   - [x] Region filter: `<select>` dropdown with dynamic options
   - [x] Vintage range: two number inputs (min, max)
   - [x] Minimum rating: number input or range slider (1-10)
   - [x] "Clear all" button to reset all filters
   - [x] Add appropriate test-id attributes (`filter-panel`, `filter-toggle`, `filter-count`, etc.)

5. Implement Search view (`src/views/Search.svelte`)
   - [x] Replace stub with full implementation
   - [x] Search bar at top with text input
   - [x] Sort dropdown (name, vintage, rating, quantity, recently added)
   - [x] FilterPanel component integration
   - [x] Load bottles from storage on mount using `$effect`
   - [x] Apply filters and sorting reactively using `$derived`
   - [x] Display results as list of BottleCard components
   - [x] Show result count ("X bottles found")
   - [x] Empty state when no results match filters (with message)
   - [x] Empty state when cellar is empty (with CTA to /add)
   - [x] Add appropriate test-id attributes (`search-input`, `sort-select`, `results-count`, `search-empty-state`, etc.)

6. Write component tests
   - [x] BottleCard test (`src/views/BottleCard.test.ts`): renders all fields, handles missing optional fields, displays zero quantity
   - [x] FilterPanel test (`src/views/FilterPanel.test.ts`): toggle open/close, apply filters, clear filters, active filter count
   - [x] Search view test (`src/views/Search.test.ts`): full integration — search, filter, sort, empty states, results display

7. Update ROADMAP.md
   - [x] Mark Step 5 items as done

8. Update CHANGELOG.md
   - [x] Add entry for Search & Filter feature

9. Commit changes
   - [x] Commit all changes with descriptive message
