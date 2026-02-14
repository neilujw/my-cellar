# Backlog

# Monitor Tailwind CSS impact on bundle size

## Context
During project setup planning, Tailwind CSS was chosen for styling. The project has a 15-20kb gzipped bundle size target for the final app.

## Dependency
Depends on Step 10 (Polish & Optimization) where final bundle size optimization is performed.

## Details
Tailwind CSS with proper purging typically produces small output, but the impact on the overall bundle size should be monitored throughout development. If the 15-20kb target becomes unachievable, consider switching to plain scoped CSS or a lighter alternative. Measure gzipped size after each major step.

# Consider adding Playwright for E2E testing

## Context
During project setup planning, only Vitest was chosen for testing. End-to-end browser testing was deferred to keep the initial setup simple.

## Dependency
No hard dependency. Can be added at any point, but most useful after Step 3 (Dashboard) when there is real UI to test.

## Details
Playwright could provide confidence in cross-browser behavior and full user flow testing (e.g., adding a bottle, syncing to GitHub). Evaluate whether Vitest with `@testing-library/svelte` provides sufficient coverage, and add Playwright if gaps are found.

# Autocomplete for Add Bottle form fields

## Context
During Add Bottle planning, all text fields (country, region, grape variety) were kept as free-text input. The user wants autocomplete suggestions to speed up data entry and reduce typos.

## Dependency
Depends on Step 4 (Add Bottle) being implemented first. Can be added as an enhancement once the basic form works and there is existing bottle data to suggest from.

## Details
Add autocomplete/suggestion functionality to selected fields on the Add Bottle form (e.g., country, region, grape variety). Suggestions should be sourced from existing bottle data in the cellar — as the user types, matching values from previously entered bottles are shown. This avoids the need for an external database while improving consistency and input speed. Consider which fields benefit most from autocomplete and whether to use a lightweight datalist or a custom dropdown component.

# Consume/Remove bottle actions

## Context
During Add Bottle planning, the form was scoped to add-only. Consuming and removing bottles requires a different UI entry point.

## Dependency
Depends on Step 5 (Search & Filter) which provides the bottle listing where consume/remove actions would be triggered from.

## Details
Users need a way to mark bottles as consumed or removed. This should be accessible from a bottle detail view or directly from search results. The action should create a history entry with the appropriate action type (consumed/removed), quantity, and optional notes. Consider a swipe gesture or action menu on mobile for quick access.

# Discuss bundle size strategy

## Context
After completing Step 2 (Data Model & Local Storage), the production build is ~15.46 kB gzipped JS + ~2.50 kB gzipped CSS (~18 kB total). The project targets 15-20 kB for the final optimized app.

## Dependency
Should be discussed before significant new dependencies are added, ideally before Step 6 (GitHub Integration) which will add the GitHub API client.

## Details
The current bundle is already near the 15-20 kB target with only the foundation and data layer in place. Adding features like GitHub API integration, offline sync, and conflict resolution will increase bundle size. Need to discuss: whether the 15-20 kB target is still realistic, whether to raise the target, or whether to adopt code-splitting strategies to keep the initial load small.
