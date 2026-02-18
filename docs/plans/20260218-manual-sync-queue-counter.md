# Feature Manual Sync with Queue Counter

Plan created at 2026-02-18. Completed at 2026-02-18.

## Goal

Replace the current auto-sync model (which pushes to GitHub after every mutation) with a fully manual sync model. Every local change (add, consume, edit, remove) immediately queues itself in IndexedDB without touching GitHub. A new clickable SVG icon button in the header shows the number of pending changes as a badge and lets the user push (when queue is non-empty) or pull (when queue is empty) on demand. The automatic retry logic is removed entirely. The Settings sync section is refactored into explicit "Force Push (create PR)" and "Force Pull (overwrite local)" actions.

## Acceptance criterias

- [x] After adding a bottle, `getSyncQueueCount()` returns 1 and no GitHub API call is made.
- [x] After consuming a bottle, `getSyncQueueCount()` increases by 1 and no GitHub API call is made.
- [x] After editing a bottle, `getSyncQueueCount()` increases by 1 and no GitHub API call is made.
- [x] After removing a bottle, `getSyncQueueCount()` increases by 1 and no GitHub API call is made.
- [x] On app startup with 3 pre-existing queue items, the header badge shows "3" and no automatic push is triggered.
- [x] `SyncButton` renders a numeric badge with the current pending count when `pendingCount > 0`.
- [x] `SyncButton` shows an upload SVG icon when `pendingCount > 0`.
- [x] `SyncButton` shows a download SVG icon when `pendingCount === 0` and status is `'connected'`.
- [x] `SyncButton` shows a spinning icon while `status === 'syncing'`.
- [x] `SyncButton` is not rendered when status is `'not-configured'`.
- [x] Clicking `SyncButton` when `pendingCount > 0` triggers `manualPush()`, clears the queue on success, and sets status to `'connected'`.
- [x] Clicking `SyncButton` when `pendingCount === 0` triggers `manualPull()`, replaces local data on success, and sets status to `'connected'`.
- [x] `manualPush()` sets status to `'conflict'` when the remote SHA has changed, without clearing the queue.
- [x] `manualPush()` sets status to `'error'` and shows an error toast when the GitHub API call fails.
- [x] `manualPull()` sets status to `'connected'` and clears the queue on success.
- [x] Settings section shows "Force Push (create PR)" button that calls `createConflictPR()` with local bottles.
- [x] Settings section shows "Force Pull (overwrite local)" button that calls `pullFromGitHub()` and replaces local data.
- [x] `calculateBackoffDelay`, `scheduleRetry`, `processQueue`, and `attemptSync` are removed from `sync-manager.ts`.
- [x] All existing tests pass after retry-related test cases are removed/updated.
- [x] Coding style requirements are respected (Prettier, ESLint, TypeScript strict).
- [x] Testing requirements are respected (≥80% coverage on sync logic, Arrange-Act-Assert).
- [x] Key decisions from the user are documented in `docs/decisions/20260218-manual-sync.md`.
- [x] `PROJECT.md` is updated to reflect the new sync model.
- [x] `ROADMAP.md` is updated to mark Step 15 as done.
- [x] `CHANGELOG.md` is updated.

## Out of scope

- **Conflict resolution UI**: `ConflictModal.svelte` behavior and PR/overwrite options are unchanged. Only `cancelRetries()` call is removed from it.
- **Offline detection**: No automatic network state detection. Push failure simply sets `'error'` status.
- **Partial push**: Sync always pushes the full bottle collection snapshot, not individual queued items.
- **Queue item details view**: The queue stores action descriptions for counting purposes; no UI to inspect queue contents.
- **SyncStatus type cleanup**: The `'offline'` value is kept in the `SyncStatus` type for compatibility; it is no longer set in the new flow.

## Implementation Steps

1. **Add `enqueueMutation()` helper to `sync-manager.ts`**
   - [x] Export a new function `enqueueMutation(description: string): Promise<void>` that calls `addToSyncQueue({ timestamp, action })`, then dispatches `sync-status-changed` with the current status (unchanged) and the new queue count.
   - [x] This function is the single entry-point for all mutation handlers to record a pending change.

2. **Remove auto-sync from all mutation handlers**
   - [x] In `src/lib/bottle-actions.ts`: remove the `attemptSync()` calls from `consumeBottle()` and `removeBottle()`; replace with `await enqueueMutation(description)`.
   - [x] In `src/views/AddBottle.svelte` `handleSubmit()`: remove `const status = await attemptSync(syncDescription)` and the conflict guard that follows; replace with `await enqueueMutation(syncDescription)` after saving; always navigate away on success.
   - [x] In `src/views/EditBottle.svelte` `handleSave()`: remove `attemptSync()` call; replace with `await enqueueMutation(description)`.

3. **Simplify `sync-manager.ts`**
   - [x] Remove exported functions: `attemptSync()`, `processQueue()`, `calculateBackoffDelay()`.
   - [x] Remove internal functions: `scheduleRetry()`, `handleMaxRetriesExhausted()`.
   - [x] Remove module-level state: `retryAttempt`, `retryTimer`, `scheduleFn`.
   - [x] Remove exports that only existed for testing: `getRetryAttempt()`, `setScheduleFn()`.
   - [x] Keep `cancelRetries()` as a no-op stub (still called by `ConflictModal.svelte`) — or update callers (see step 6).
   - [x] Keep `isSyncing()` and `resetSyncManagerState()` for testing; update `resetSyncManagerState()` to only reset `syncing = false`.
   - [x] Add `manualPush(): Promise<void>` — pushes full collection to GitHub, clears queue on success, dispatches `'connected'`; on conflict dispatches `'conflict'`; on failure dispatches `'error'` and shows error toast. No retry scheduling.
   - [x] Add `manualPull(): Promise<void>` — pulls from GitHub, replaces all local bottles, clears queue on success, dispatches `'connected'`. On failure dispatches `'error'` and shows error toast.
   - [x] Update `dispatchSyncStatus()` signature to accept optional `pendingCount` (default 0) for consistency.

4. **Update `App.svelte`**
   - [x] Remove the `import { processQueue }` and its `$effect` that calls `processQueue()` on startup.
   - [x] Add a `$effect` that on startup (when settings exist) reads `getSyncQueueCount()` from IDB and sets `pendingCount` to initialize the badge.
   - [x] Remove the `<span>` sync status text element from the header.
   - [x] Import and render the new `<SyncButton>` component in its place, passing `syncStatus` and `pendingCount` as props.
   - [x] `SyncButton` dispatches sync-status-changed events internally, so `App.svelte`'s existing event handlers remain.

5. **Create `src/components/SyncButton.svelte`**
   - [x] Props: `syncStatus: SyncStatus`, `pendingCount: number`.
   - [x] Do not render anything when `syncStatus === 'not-configured'`.
   - [x] Show a `<button>` with an inline SVG icon and a numeric badge.
   - [x] **Icons** (inline SVG, no dependency):
     - Upload arrow (↑): when `pendingCount > 0` or `syncStatus === 'error'`
     - Download arrow (↓): when `pendingCount === 0` and `syncStatus === 'connected'`
     - Spinning circular arrows: when `syncStatus === 'syncing'`
     - Warning/exclamation: when `syncStatus === 'conflict'`
   - [x] **Badge**: show a small circle with `pendingCount` when `pendingCount > 0`; hide otherwise.
   - [x] **Label text** (below or beside icon, small):
     - `pendingCount > 0`: `"{N} pending"`
     - `syncStatus === 'connected'` and `pendingCount === 0`: `"Synced"`
     - `syncStatus === 'syncing'`: `"Syncing..."`
     - `syncStatus === 'error'`: `"Error"`
     - `syncStatus === 'conflict'`: `"Conflict"`
   - [x] **Colors**: blue while syncing, green when synced, amber for pending, red for error, orange for conflict.
   - [x] **Click handler**: calls `manualPush()` when `pendingCount > 0`, else `manualPull()`; disabled while `syncStatus === 'syncing'` or `syncStatus === 'conflict'`.
   - [x] Add `data-testid="sync-button"` and `data-testid="sync-badge"` for testability.

6. **Update `src/views/SyncSection.svelte`**
   - [x] Rename "Push" button to "Force Push (create PR)" with `data-testid="force-push-button"`.
   - [x] Rename "Pull" button to "Force Pull (overwrite local)" with `data-testid="force-pull-button"`.
   - [x] **Force Push logic**: instead of calling `pushToGitHub()`, call `createConflictPR(client, repo, bottles)` from `github-sync.ts` directly. This always creates a PR regardless of SHA mismatch.
   - [x] **Force Pull logic**: unchanged — still calls `pullFromGitHub()` and replaces local data. Remove `cancelRetries()` call.
   - [x] Remove the `import { cancelRetries }` from `sync-manager` (no longer needed).
   - [x] Update section title and description text to reflect the new purpose ("Force sync options").

7. **Update `src/components/ConflictModal.svelte`**
   - [x] Remove the `cancelRetries()` call and its import from `sync-manager`.

8. **Update tests**
   - [x] In sync-manager tests: remove all test cases covering `calculateBackoffDelay`, `scheduleRetry`, retry counting, and `processQueue`. Add tests for `manualPush()` (success, conflict, failure) and `manualPull()` (success, failure) and `enqueueMutation()`.
   - [x] Add component tests for `SyncButton`: badge visibility and count, icon state per status, click triggers correct action, disabled state while syncing.
   - [x] Add/update unit tests for `bottle-actions.ts`: verify `addToSyncQueue` is called and `attemptSync` is NOT called.
   - [x] Add/update unit tests for `AddBottle.svelte` and `EditBottle.svelte`: verify navigation always happens after save (no conflict abort).

9. **Update documentation**
   - [x] Update `docs/PROJECT.md` sync model description to reflect manual sync.
   - [x] Verify all acceptance criterias pass.
   - [x] Update `ROADMAP.md` to mark Step 15 as done.
   - [x] Update `CHANGELOG.md` with this feature.
