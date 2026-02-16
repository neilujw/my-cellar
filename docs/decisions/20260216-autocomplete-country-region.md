# Feature: Autocomplete for Country & Region

Decision made on 2026-02-16

## Feature overview
Add autocomplete dropdowns to the Country and Region fields in the Add Bottle form to speed up data entry and reduce typos, using existing bottle data as the suggestion source.

## Context
Step 12 in the roadmap originally included autocomplete for Country, Region, and Grape Varieties. During planning, several design decisions were made:
1. **Suggestion source**: Whether to use a static built-in list of values or only existing bottle data.
2. **Dropdown trigger**: When to show suggestions (on focus, after 1 char, after 2 chars).
3. **Grape Varieties**: Whether to add autocomplete to the existing `GrapeTagInput` component.
4. **Component architecture**: Whether to create one generic component or per-field components.

## Decision
- **Existing bottles only**: Suggestions are sourced exclusively from bottles already in the cellar. No static/external data lists. This keeps the implementation simple and the data source consistent.
- **Show on focus + filter while typing**: The dropdown shows all suggestions immediately when the field is focused, then filters as the user types. This is optimal for short lists (countries, regions from ~100 bottles).
- **Grape Varieties kept as-is**: The current `GrapeTagInput` free-text tag input is sufficient. Grape variety autocomplete is removed from Step 12 scope entirely (not added to backlog).
- **Generic reusable component**: A single `TextAutocomplete` component is created and reused for both Country and Region fields. This avoids code duplication and follows DRY principles.
