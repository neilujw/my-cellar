# Feature Search & Filter

Decision made on 2026-02-14

## Feature overview
Implement the Search & Filter view (Step 5) allowing users to search, filter, and sort their wine collection from a mobile-optimized interface.

## Context
The app has a Dashboard and Add Bottle views. The Search view is currently a stub. Several design choices needed to be made: how text search works, how filters are displayed on mobile, what actions are available on result cards, how empty bottles are handled, and how sorting works.

## Decision
- **Text search**: Matches against bottle name only. Keeps it simple and fast.
- **Filter UI**: Collapsible filter panel behind a "Filters" button. Saves screen space on mobile while keeping all filters accessible.
- **Filter options**: Dynamic values only — country and region dropdowns show only values present in the cellar.
- **Bottle cards**: Read-only, showing bottle info (name, vintage, type, quantity, rating) with no inline actions. Detail/edit views will come later.
- **Empty bottles**: Always show all bottles regardless of current quantity. Quantity is displayed on each card.
- **Sorting**: User-selectable sort via dropdown. Options: name (default), vintage, rating, quantity, recently added. Default sort is alphabetical by name.
