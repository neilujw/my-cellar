# Feature: UX Polish — Vintage & Search

Decision made on 2026-02-21

## Feature overview
Step 17 adds three UX improvements: support for wines without a vintage ("no vintage" / NV), accent-insensitive text matching across the app, and proper handling of vintage=0 in filters and sorting.

## Context
Users need to add non-vintage wines (e.g., NV Champagne) but the current form requires a year between 1900–2099. Additionally, wine names and regions often contain accented characters (Château, Côtes, España) which makes exact text matching a poor experience for search and filters. Several decisions were needed on how to implement these.

## Decision
1. **No vintage UX**: A "No vintage" checkbox next to the vintage input in the Add Bottle form. When checked, the input is disabled and vintage is stored as `0`. The checkbox only appears in the Add Bottle form — the Edit Bottle modal keeps vintage as read-only (key field). Display shows "N/A" everywhere vintage=0 appears.
2. **Accent normalization scope**: Applied to all text matching — name search, country filter, region filter, and duplicate detection (name comparison). Uses `String.prototype.normalize('NFD')` to strip combining diacritical marks (no external dependency needed).
3. **Duplicate detection with NV**: Vintage=0 is treated as a valid matching value. Two bottles with the same name, type, and vintage=0 are considered duplicates, consistent with how any other vintage value works.
4. **Vintage filters/sorting with NV**: No-vintage bottles (vintage=0) are excluded from vintage range filters (they only appear when no vintage filter is set). When sorting by vintage, NV bottles are placed at the end.
