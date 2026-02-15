# Feature Offline Capability & Sync Queue

Decision made on 2026-02-15

## Feature overview
Add offline capability to the wine cellar app so that local changes are queued when GitHub sync fails, and automatically retried with exponential backoff when connectivity is restored.

## Context
The app currently supports manual push/pull sync with GitHub but has no handling for offline scenarios. When a sync attempt fails (network error), the user sees an error but changes are not retried. The app needs to gracefully handle connectivity loss, queue pending changes, and auto-sync when possible.

## Decision
- **Offline detection**: Reactive, not proactive. Offline state is detected when a GitHub sync attempt fails (no periodic pings or `navigator.onLine` checks). This keeps the implementation simple and avoids false positives from unreliable browser APIs.
- **Auto-sync**: When a failed sync succeeds on retry, changes are pushed automatically without user confirmation.
- **Queue visibility**: A badge count of pending changes is shown next to the sync status indicator in the header (e.g., "Offline (3 pending)").
- **Retry strategy**: Exponential backoff with a configurable max retry count (default: 10). The max retry count is a code-level configuration constant, not a user-facing setting.
- **Startup behavior**: The app always loads from local IndexedDB first. If GitHub is unreachable, show offline indicator and use cached local data. Sync when possible.
- **Queue scope**: All write actions are queued (add bottle, consume, remove, any bottle edit).
- **Queue persistence**: The sync queue is persisted in IndexedDB so pending changes survive browser restarts. The queue is processed on next app load or when a sync attempt succeeds.
