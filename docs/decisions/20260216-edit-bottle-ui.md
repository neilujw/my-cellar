# Feature Edit Bottle UI

Decision made on 2026-02-16

## Feature overview
Adding the ability to view bottle details and edit bottle metadata (rating, notes, location, grape variety, country, region) from within the app.

## Context
Currently, BottleCard is read-only and there is no bottle detail view. To allow editing, we need both a detail view (to see full bottle info) and an edit form. Several UI patterns were considered: tapping to edit directly, adding edit icons on cards, or introducing a detail view with an edit action. The form could be a modal or a new route.

## Decision
- Tapping a BottleCard opens a **full-page modal** showing all bottle fields and the full history timeline (BottleDetail).
- The detail view has an **Edit button** that opens an **edit modal overlay** on top of the detail view.
- **All non-key fields** are editable: rating, notes, location, grape variety, country, region.
- **Key fields** (name, vintage, type) are shown as **visible but disabled** in the edit form to provide context.
- No new routes are needed; both detail and edit views are modal overlays.
