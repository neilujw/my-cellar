# Feature Add Bottle

Decision made on 2026-02-14

## Feature overview
The Add Bottle feature provides a form to add new wines to the cellar, with duplicate detection and quantity merging for existing bottles.

## Context
Four design decisions were made during planning of the Add Bottle form to define user interaction patterns: duplicate handling, action scope, grape variety input method, and post-submission navigation.

## Decision

### Duplicate detection: Auto-merge with confirmation
When the user submits a bottle that matches an existing one (same type + vintage + name), the UI shows a confirmation banner saying "This wine already exists" and lets the user confirm adding the quantity to the existing bottle's history. This avoids accidental duplicates while keeping the flow smooth.

### Form scope: Add only
The form only handles adding new bottles and quantity. Consuming and removing bottles will be handled in a future step (e.g., from search results or a bottle detail view). This keeps the form simple and focused.

### Grape variety input: Free-text tags
The user types grape names and presses Enter or comma to add them as tags. No predefined list is used. Tags can be removed individually. This gives flexibility without requiring a maintained grape database.

### Post-add navigation: Redirect to dashboard
After successfully adding a bottle, the user is navigated back to the dashboard to see updated statistics. This provides immediate visual feedback that the addition was successful.
