# Feature: Autocomplete for Duplicate Prevention

Decision made on 2026-02-15

## Feature overview
Adding name-based autocomplete to the Add Bottle form to proactively detect and prevent duplicate bottles. When a user selects an existing bottle from autocomplete, the form auto-fills and restricts editing to history-entry fields.

## Context
The existing duplicate detection only triggers after form submission, which is a late and surprising experience. Users should see matches as they type the bottle name and be guided toward updating an existing bottle rather than accidentally creating a duplicate. Three design decisions were made:

1. **Selection behavior**: Auto-fill form fields from the selected bottle. Only history-entry fields (quantity, price, currency, purchase notes) remain editable. Name, vintage, and type remain editable to allow re-triggering duplicate detection. Other fields (country, region, grape variety, location, rating, notes) become read-only.

2. **Matching strategy**: Case-insensitive "contains" matching on the name field. This is more forgiving than "starts with" — typing "marg" will match "Château Margaux".

3. **Duplicate rule**: Unchanged — a duplicate is defined as matching type + vintage + name (case-insensitive). Same name with different vintage or type is a separate bottle.

## Decision
Implement a custom autocomplete component (no external dependency) with "contains" matching on bottle name. On selection, auto-fill the form and lock non-key fields to read-only. Keep the existing type+vintage+name duplicate rule. Editing name, vintage, or type re-triggers duplicate detection reactively.
