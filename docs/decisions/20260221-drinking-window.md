# Feature Drinking Window

Decision made on 2026-02-21

## Feature overview
Add a `consumeStartingFrom` optional field to track when a wine becomes ready to drink, with visual indicators on bottle cards, a dashboard section for ready-to-drink bottles, and a search filter.

## Context
Step 16 of the roadmap introduces a drinking window feature. Several design decisions were needed: whether to track an end date, what visual states to display, where to place the dashboard section, and how to integrate with search.

## Decision
- **Single field only**: Only `consumeStartingFrom` (year, YYYY format) is added. No end-of-window / `consumeEndBy` field — keeps the model and UI simple.
- **Visual indicator**: Only a "Ready to drink" badge is shown on BottleCard when `consumeStartingFrom <= currentYear` and quantity > 0. No "Aging" or "Past peak" indicators.
- **Dashboard placement**: "Bottles to Drink This Year" section appears after Statistics, before Recent Bottles. Shows up to 5 bottles using full BottleCard components (consistent UX with existing sections).
- **Validation**: `consumeStartingFrom` must be >= vintage year when both are set.
- **Search filter**: A "Ready to drink" toggle checkbox is added to FilterPanel, filtering bottles where `consumeStartingFrom <= currentYear` and quantity > 0.
