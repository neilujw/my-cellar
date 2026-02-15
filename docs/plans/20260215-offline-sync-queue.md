# Feature Offline Capability & Sync Queue

Plan created at 2026-02-15

## Status: COMPLETED

## Goal

Add offline resilience to the wine cellar app. When a GitHub sync operation fails (due to network issues or API errors), local changes are preserved in a persistent sync queue and automatically retried with exponential backoff. The sync status indicator is enhanced to show offline state and pending change count. On app startup, local IndexedDB data is used immediately, with GitHub sync happening in the background.

## Acceptance criterias

- [x] When a push to GitHub fails (network error), the app transitions to "offline" sync status and queues the sync for retry
- [x] When a pull from GitHub fails on startup, the app loads local IndexedDB data and shows "offline" status
- [x] All local write actions (add bottle, consume, remove, edit) trigger a sync attempt; if it fails, changes are queued
- [x] The sync queue is persisted in IndexedDB and survives browser restarts
- [x] Queued changes are retried with exponential backoff (configurable max retries, default 10)
- [x] When a retry succeeds, the queue is cleared and sync status returns to "connected"
- [x] When all retries are exhausted, sync status shows "error" and the user can manually trigger sync
- [x] The header sync status indicator shows pending change count when offline (e.g., "Offline (3 pending)")
- [x] The sync status indicator shows distinct states: not-configured, connected, offline, syncing, error
- [x] On app startup with pending queue items, the app attempts to sync automatically
- [x] All tests pass
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] `ROADMAP.md` is updated
- [x] `CHANGELOG.md` is updated

## Out of scope

- **Conflict resolution**: Detecting and resolving conflicts between local and remote state is Step 9. This step only handles the case where sync fails due to connectivity, not data conflicts.
- **Proactive offline detection**: No `navigator.onLine` checks or periodic pings. Offline is detected reactively when a sync attempt fails.
- **User-facing retry configuration**: The max retry count is a code constant, not exposed in the Settings UI.
- **Partial sync**: The sync queue does not track individual bottle changes. It triggers a full push (the existing `pushToGitHub` behavior) when processing the queue.
- **Service worker / PWA**: No service worker for caching assets or intercepting network requests. Offline capability is limited to data persistence.

## Implementation Steps

1. **Extend types for sync queue and enhanced sync status**
   - [x] Add `'error'` to the `SyncStatus` type (currently: `'not-configured' | 'connected' | 'offline' | 'syncing'`)
   - [x] Add a `SyncQueueEntry` interface with fields: `id` (auto-increment), `timestamp` (ISO string), `action` description (for display)
   - [x] Add a `SYNC_MAX_RETRIES` constant (default: 10) in a new `src/lib/sync-config.ts` module

2. **Create sync queue persistence layer in IndexedDB**
   - [x] Add a `sync-queue` object store to the IndexedDB database (bump DB version to 2 with migration)
   - [x] Implement `addToSyncQueue(entry)` - adds a queue entry
   - [x] Implement `getSyncQueue()` - returns all pending queue entries
   - [x] Implement `clearSyncQueue()` - removes all entries after successful sync
   - [x] Implement `getSyncQueueCount()` - returns the number of pending entries
   - [x] Write unit tests for all sync queue operations

3. **Create sync manager with retry logic**
   - [x] Create `src/lib/sync-manager.ts` module responsible for orchestrating sync attempts
   - [x] Implement `attemptSync()` - tries to push local state to GitHub; on failure, adds to queue and schedules retry
   - [x] Implement exponential backoff retry with formula: `delay = min(1000 * 2^attempt, 60000)` (cap at 60s)
   - [x] Track current retry state (attempt count, next retry timer)
   - [x] Implement `cancelRetries()` - cancels any pending retry timers
   - [x] Implement `processQueue()` - called on app startup to process any persisted queue items
   - [x] Dispatch `sync-status-changed` custom events to update the header indicator
   - [x] Write unit tests for retry logic, backoff timing, max retry exhaustion, and queue processing

4. **Integrate sync manager into existing write flows**
   - [x] Modify `AddBottle.svelte` to call `attemptSync()` after successfully saving a bottle to IndexedDB
   - [x] Modify `SyncSection.svelte` push button to use the sync manager (so manual push also feeds into the retry system)
   - [x] Modify `SyncSection.svelte` pull to handle failure gracefully (show offline status, keep local data)
   - [x] Ensure that manual push/pull from Settings resets retry state and clears the queue on success

5. **Update sync status indicator in header**
   - [x] Add `'error'` status display with red color and error message
   - [x] Add pending change count badge next to offline status (e.g., "Offline (3 pending)")
   - [x] Add pending change count badge next to error status (e.g., "Error (3 pending)")
   - [x] Listen for updated `sync-status-changed` events that include pending count
   - [x] Write component tests for all sync status display states

6. **Handle app startup sync**
   - [x] On app mount in `App.svelte`, check for pending sync queue items
   - [x] If queue is non-empty and GitHub is configured, trigger `processQueue()` automatically
   - [x] If GitHub is not configured, do nothing (show "not-configured" as before)
   - [x] Ensure local IndexedDB data is loaded immediately (no blocking on sync)

7. **Verify all acceptance criterias**
   - [x] Run all existing and new tests
   - [x] Verify coding style (lint, format)
   - [x] Verify test coverage for new modules

8. **Update `ROADMAP.md`**
   - [x] Mark Step 8 as completed with checkmarks

9. **Update `CHANGELOG.md`**
   - [x] Add entry for Step 8 describing offline capability and sync queue
