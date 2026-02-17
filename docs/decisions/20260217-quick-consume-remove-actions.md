# Feature Quick Consume/Remove Actions

Decision made on 2026-02-17

## Feature overview
Quick consume and remove actions allowing users to decrement bottle stock by 1 directly from BottleCard or BottleDetail, with immediate feedback and no confirmation dialogs.

## Context
Step 14 requires adding consume/remove functionality. Key design decisions needed: where actions appear, whether to use a quantity modal or quick single-bottle actions, confirmation behavior, notes support, and button style on cards.

## Decision
- **Entry points**: Both BottleCard (small icon buttons visible at all times) and BottleDetail modal.
- **Quantity**: Quick 1-bottle only. No quantity picker, no custom amounts.
- **Confirmation**: No confirmation step. Actions apply immediately with a success toast notification.
- **Notes**: No notes field on quick actions. History entries are created without notes.
- **Card button style**: Small icon buttons (consume as "-" and remove as "x") directly on the BottleCard, visible at all times when stock > 0.
- **Zero stock**: Buttons are hidden (not disabled) when current quantity is 0.
