# Backlog

# ~~Monitor Tailwind CSS impact on bundle size~~ (Resolved)

Resolved on 2026-02-16: Bundle size hard limit removed entirely. Tailwind CSS output is minimal (3.78 KB gzipped). See `docs/decisions/20260216-remove-bundle-size-limit.md`.

# ~~Consider adding Playwright for E2E testing~~ (Resolved)

Resolved on 2026-02-16: Playwright will be added in Step 11 for core user flows (add bottle, search/filter, navigation). See `docs/decisions/20260216-playwright-e2e.md`.

# ~~Autocomplete for Add Bottle form fields~~ (Resolved)

Resolved on 2026-02-16: Autocomplete implemented for name (Step 10), country, and region (Step 12) in the Add Bottle form, and for country and region in the Edit Bottle form (Step 13). Grape variety uses a free-text tag input (GrapeTagInput). See `docs/decisions/20260215-autocomplete-duplicate-prevention.md` and `docs/decisions/20260216-autocomplete-country-region.md`.

# ~~Consume/Remove bottle actions~~ (Resolved)

Resolved on 2026-02-17: Planned as Step 14 with quick 1-bottle actions on BottleCard and BottleDetail. See `docs/plans/20260217-quick-consume-remove-actions.md` and `docs/decisions/20260217-quick-consume-remove-actions.md`.

# Editing key fields (name, vintage, type)

## Context
During Step 13 (Update Bottle Rating & Notes) planning, editing was scoped to non-key fields only. Key fields (name, vintage, type) are used for duplicate detection and determine the file path in GitHub (`wines/{type}/wine-{uuid}.json`).

## Details
Allowing users to edit key fields would require re-running duplicate validation (to prevent creating a duplicate by renaming), potentially renaming/moving the file in GitHub if the type changes, and updating any references. This adds significant complexity and should be planned as a separate feature if needed.

# ~~Discuss bundle size strategy~~ (Resolved)

Resolved on 2026-02-15: Bundle size target raised from 15-20kb to 50kb to accommodate Octokit and future sync features. See `docs/decisions/20260215-bundle-size-target.md`.
