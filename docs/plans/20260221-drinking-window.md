# Feature Drinking Window (Consume Starting From)

Plan created at 2026-02-21

## Goal

Add a `consumeStartingFrom` optional field to the bottle data model so users can track when a wine becomes ready to drink. Display a "Ready to drink" visual indicator on bottle cards for bottles whose drinking window has arrived. Add a "Bottles to Drink This Year" section on the dashboard (after Statistics) showing up to 5 bottles ready to drink. Add a "Ready to drink" toggle filter in Search. The field is editable in both Add Bottle and Edit Bottle forms, validated as >= vintage year.

## Acceptance criterias

- [x] `Bottle` interface in `types.ts` includes `consumeStartingFrom?: number` (optional, YYYY format)
- [x] `BOTTLE_KEY_ORDER` in `bottle-serializer.ts` includes `consumeStartingFrom` (between `notes` and `history`)
- [x] `deserializeBottle` validates `consumeStartingFrom` as optional integer when present
- [x] Add Bottle form has an optional "Drink from" year input field
- [x] `FormData` includes `consumeStartingFrom` field, `createBottleFromForm` maps it to the bottle
- [x] `validateForm` rejects `consumeStartingFrom` < vintage when both are set
- [x] Edit Bottle form includes editable "Drink from" field
- [x] `buildUpdatedBottle` includes `consumeStartingFrom`
- [x] BottleCard shows a "Ready to drink" badge when `consumeStartingFrom` is set and <= current year and quantity > 0
- [x] BottleCard shows no indicator when `consumeStartingFrom` is not set or is in the future
- [x] BottleDetail displays `consumeStartingFrom` value (e.g., "Drink from 2028") when set
- [x] Dashboard shows "Bottles to Drink This Year" section after Statistics, before Recent Bottles
- [x] Dashboard section shows up to 5 bottles where `consumeStartingFrom` <= current year and quantity > 0
- [x] Dashboard section is hidden when no bottles match
- [x] `SearchFilters` includes `readyToDrink: boolean` filter
- [x] FilterPanel has a "Ready to drink" toggle checkbox
- [x] `filterBottles` filters by `consumeStartingFrom <= currentYear` and `quantity > 0` when toggle is on
- [x] `countActiveFilters` counts `readyToDrink` when enabled
- [x] Clear all filters resets the `readyToDrink` toggle
- [x] `PROJECT.md` data model is updated with the new field
- [x] All existing tests still pass
- [x] New unit tests cover all new/modified utility functions
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] `ROADMAP.md` is updated
- [x] `CHANGELOG.md` is updated

## Out of scope

- **End-of-window / drink-by date**: Only `consumeStartingFrom` is tracked. No `consumeEndBy` field. Simplifies the model and UI.
- **"Aging" indicator on cards**: Only "Ready to drink" is shown. Bottles still aging (future year) show no special indicator.
- **"Past peak" state**: No tracking of when a wine is past its drinking window (would require an end date).
- **Notifications/reminders**: No push notifications or reminders when a wine becomes ready to drink.

## Implementation Steps

1. Update data model and serialization
   - [x] Add `consumeStartingFrom?: number` to `Bottle` interface in `types.ts`
   - [x] Add `consumeStartingFrom` to `BOTTLE_KEY_ORDER` in `bottle-serializer.ts` (between `notes` and `history`)
   - [x] Add validation for `consumeStartingFrom` (optional integer) in `validateBottleData` in `bottle-serializer.ts`
   - [x] Update `PROJECT.md` bottle schema to include the new field
   - [x] Add unit tests for serialization/deserialization with the new field

2. Update Add Bottle form
   - [x] Add `consumeStartingFrom: string` to `FormData` in `form-utils.ts`
   - [x] Add `consumeStartingFrom: ''` to `createEmptyFormData`
   - [x] Update `validateForm`: when `consumeStartingFrom` is non-empty and vintage is set, reject if `consumeStartingFrom < vintage`
   - [x] Update `createBottleFromForm` to map the field (parse to number or omit if empty)
   - [x] Add "Drink from" year input field to `AddBottle.svelte` (in a suitable fieldset, e.g., after Storage/Location)
   - [x] Update unit tests in `form-utils.test.ts` for validation and bottle creation
   - [x] Update `AddBottle.test.ts` for the new field rendering and validation

3. Update Edit Bottle
   - [x] Add `consumeStartingFrom` to editable fields in `EditBottle.svelte`
   - [x] Update `buildUpdatedBottle` in `edit-bottle-utils.ts` to include `consumeStartingFrom`
   - [x] Update `isDirty` check if needed
   - [x] Update unit tests in `edit-bottle-utils.test.ts`
   - [x] Update `EditBottle.test.ts`

4. Update BottleCard display
   - [x] Add "Ready to drink" badge to `BottleCard.svelte` when `consumeStartingFrom <= currentYear` and quantity > 0
   - [x] No indicator when field is not set or year is in the future
   - [x] Update `BottleCard.test.ts`

5. Update BottleDetail display
   - [x] Display "Drink from YYYY" in `BottleDetail.svelte` when `consumeStartingFrom` is set
   - [x] Update `BottleDetail.test.ts`

6. Add dashboard "Bottles to Drink This Year" section
   - [x] Add `getBottlesToDrinkThisYear(bottles, currentYear, limit)` to `dashboard-utils.ts` — returns bottles where `consumeStartingFrom <= currentYear` and quantity > 0, sorted by `consumeStartingFrom` ascending, limited to `limit`
   - [x] Add section to `Dashboard.svelte` after Statistics, before Recent Bottles, using full `BottleCard` components
   - [x] Hide section when no bottles match
   - [x] Add unit tests in `dashboard-utils.test.ts`

7. Add "Ready to drink" search filter
   - [x] Add `readyToDrink: boolean` to `SearchFilters` in `search-utils.ts`
   - [x] Update `createEmptyFilters` with `readyToDrink: false`
   - [x] Update `countActiveFilters` to count `readyToDrink`
   - [x] Update `filterBottles` to filter by `consumeStartingFrom <= currentYear` and quantity > 0 when `readyToDrink` is true
   - [x] Add "Ready to drink" toggle checkbox to `FilterPanel.svelte`
   - [x] Update clear all to reset `readyToDrink`
   - [x] Add unit tests in `search-utils.test.ts`
   - [x] Update `Search.svelte` clear logic if needed

8. Verify all acceptance criterias
   - [x] Run all unit tests
   - [x] Run all E2E tests
   - [x] Verify coding style (lint)
   - [x] Verify no new dependencies added

9. Update ROADMAP.md
   - [x] Mark Step 16 items as done

10. Update CHANGELOG.md
    - [x] Add entry for Drinking Window feature
