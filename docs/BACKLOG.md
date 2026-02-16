# Backlog

# ~~Monitor Tailwind CSS impact on bundle size~~ (Resolved)

Resolved on 2026-02-16: Bundle size hard limit removed entirely. Tailwind CSS output is minimal (3.78 KB gzipped). See `docs/decisions/20260216-remove-bundle-size-limit.md`.

# ~~Consider adding Playwright for E2E testing~~ (Resolved)

Resolved on 2026-02-16: Playwright will be added in Step 11 for core user flows (add bottle, search/filter, navigation). See `docs/decisions/20260216-playwright-e2e.md`.

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

# ~~Discuss bundle size strategy~~ (Resolved)

Resolved on 2026-02-15: Bundle size target raised from 15-20kb to 50kb to accommodate Octokit and future sync features. See `docs/decisions/20260215-bundle-size-target.md`.
