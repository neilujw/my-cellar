# Feature Dashboard View

Plan created at 2026-02-14

## Goal

Implement the dashboard view as the default landing page of the app. The dashboard provides an at-a-glance overview of the cellar: key statistics (total bottles, breakdown by wine type, top 3 regions), a feed of the 10 most recent activity entries, and a friendly empty state with a call-to-action when the cellar has no bottles yet. The sync status placeholder in the header is kept as a simple text badge.

## Acceptance criterias

- [x] Dashboard displays total bottle count (sum of current quantities across all bottles)
- [x] Dashboard displays bottle count breakdown by wine type (red, white, rosé, sparkling) — types with 0 bottles are shown as 0
- [x] Dashboard displays the top 3 regions by bottle count (with counts), or fewer if less than 3 regions exist
- [x] Dashboard displays the 10 most recent history entries across all bottles in compact format: `date • action • quantity × bottle name vintage` (e.g., "2026-02-10 • Added 3× Château Margaux 2015")
- [x] When no bottles exist, dashboard shows an empty state with a friendly message and a CTA button that navigates to the Add Bottle view
- [x] The sync status in the header displays as a simple text badge reading "Offline" (placeholder until GitHub sync is implemented)
- [x] Dashboard is mobile-optimized with responsive layout
- [x] Dashboard loads bottle data from IndexedDB on mount and updates reactively
- [x] All new utility/helper functions have unit tests
- [x] Dashboard component has integration tests verifying: statistics display, recent activity display, empty state with CTA, and navigation from CTA
- [x] All tests pass
- [x] Coding style requirements are respected (component < 150 lines, TypeScript strict, JSDoc, etc.)
- [x] Testing requirements are respected (AAA pattern, happy path + edge cases, descriptive names)
- [x] Dependency management requirements are respected (no new dependencies needed)
- [x] Key decisions from the user are documented
- [x] `ROADMAP.md` is updated when all the implementation steps are done
- [x] `CHANGELOG.md` is updated when all the implementation steps are done

## Out of scope

- Full bottle list/detail view: The dashboard shows recent activity, not a full inventory list. Full cellar browsing is part of Step 5 (Search & Filter).
- Real sync status: The sync badge is a static placeholder. Real sync state management is part of Steps 6-9.
- Clickable activity entries: Recent activity entries are read-only. Navigating to a bottle detail view is future work.
- Advanced analytics/charts: Per PROJECT.md, statistics are kept simple. No charts or trend analysis.
- Pull-to-refresh: Refresh/reload mechanisms will come with sync features.

## Implementation Steps

1. Create dashboard statistics utilities (`src/lib/dashboard-utils.ts`)
   - [x] `getStatsByType(bottles): Record<WineType, number>` — returns bottle count per wine type using `calculateQuantity`
   - [x] `getTopRegions(bottles, limit): Array<{ region: string; count: number }>` — returns top N regions by total bottle quantity, sorted descending
   - [x] `getRecentActivity(bottles, limit): Array<{ date: string; action: HistoryAction; quantity: number; bottleName: string; vintage: number }>` — flattens all history entries across all bottles, sorts by date descending, returns top N entries enriched with bottle name and vintage
   - [x] `getTotalBottleCount(bottles): number` — returns sum of current quantities across all bottles
   - [x] Unit tests for all functions in `src/lib/dashboard-utils.test.ts` covering: empty input, single bottle, multiple bottles, edge cases (0-quantity bottles excluded from region counts, ties in region ranking, more/fewer than limit entries)

2. Update sync status badge in header (`src/App.svelte`)
   - [x] Change the sync status text from "⏳ Not synced" to "Offline" as a simple text badge
   - [x] Update the App.test.ts test that asserts on sync status text (no change needed — test only checks element existence)

3. Implement Dashboard component (`src/views/Dashboard.svelte`)
   - [x] Load all bottles from IndexedDB on component mount using `getAllBottles()`
   - [x] Display statistics section: total count, breakdown by type (4 items), top 3 regions
   - [x] Display recent activity section: 10 most recent entries in compact format
   - [x] Display empty state when no bottles: friendly message + CTA button that calls `navigate('/add')`
   - [x] Mobile-first layout using Tailwind CSS utility classes
   - [x] Keep component under 150 lines by delegating logic to `dashboard-utils.ts` (109 lines)
   - [x] Add JSDoc comments for component props/logic

4. Write Dashboard component tests (`src/views/Dashboard.test.ts`)
   - [x] Test empty state renders with message and CTA button
   - [x] Test CTA button navigates to `/add` route on click
   - [x] Test statistics display with mock bottle data (total count, type breakdown, top regions)
   - [x] Test recent activity displays correct entries in chronological order
   - [x] Test with bottles that have 0 current quantity (consumed/removed all)
   - [x] Mock `storage.getAllBottles()` to provide test data without real IndexedDB

5. Final verification
   - [x] Run full test suite — all 60 tests pass
   - [x] Run type checking (`npm run check`) — only pre-existing upstream error in svelte/types
   - [x] Verify component stays under 150 lines (109 lines)
