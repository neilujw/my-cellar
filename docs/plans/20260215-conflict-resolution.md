# Feature Conflict Resolution

Plan created at 2026-02-15

## Goal

Implement sync conflict detection and resolution for the wine cellar app (Step 9). When a user attempts to push local changes but the remote GitHub repository has diverged since the last sync, the app detects the conflict and presents a modal dialog with two resolution options: (1) create a pull request with local changes for manual resolution in GitHub, or (2) overwrite local data with the remote state, discarding pending changes. A new 'conflict' sync status state makes conflicts immediately visible in the header.

## Acceptance criterias

- [x] Test: conflict is detected when remote commit SHA differs from last synced SHA during push
- [x] Test: no conflict is raised when remote commit SHA matches last synced SHA
- [x] Test: last synced commit SHA is stored after successful push
- [x] Test: last synced commit SHA is stored after successful pull
- [x] Test: last synced commit SHA is cleared when GitHub settings are cleared
- [x] Test: conflict modal is displayed when a conflict is detected
- [x] Test: conflict modal shows two resolution options (Create PR / Overwrite local)
- [x] Test: "Create PR" pushes local bottles to a timestamped branch and creates a PR against the default branch
- [x] Test: "Create PR" branch name follows format `conflict/YYYY-MM-DD-HHmmss`
- [x] Test: "Create PR" generates a descriptive PR title and body
- [x] Test: "Overwrite local" pulls remote data, clears sync queue, and dismisses the modal
- [x] Test: "Overwrite local" discards all pending local changes
- [x] Test: sync status indicator shows 'conflict' state with distinct styling (orange)
- [x] Test: conflict status is dispatched when a conflict is detected during push
- [x] Test: sync status returns to 'connected' after successful conflict resolution (either option)
- [x] Test: automatic retry (sync manager) detects conflicts and stops retrying, dispatching conflict status
- [x] All tests pass
- [x] Coding style requirements are respected (components ≤150 lines, TypeScript strict, JSDoc, etc.)
- [x] Testing requirements are respected (AAA pattern, ≥80% coverage on business logic, mocked GitHub API)
- [x] Dependency management requirements are respected (no new dependencies needed)
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] ROADMAP.md is updated
- [x] CHANGELOG.md is updated

## Out of scope

- **Per-bottle conflict granularity**: Conflicts are detected at the whole-repo level (commit SHA mismatch), not per individual bottle. Per-bottle diffing would add significant complexity for a single-user app.
- **Automatic conflict resolution / merge**: No automatic merging of local and remote changes. The user always decides how to resolve.
- **Conflict prevention via locking**: No file-locking or pessimistic concurrency. The app is single-user, so conflicts should be rare (e.g., two browser tabs or devices).
- **Viewing diff details**: The conflict modal does not show a detailed diff of what changed locally vs remotely. The user can inspect changes in the GitHub PR if they choose that option.

## Implementation Steps

1. **Store and manage last synced commit SHA** ✅
- [x] Add `getLastSyncedCommitSha(): string | null` and `setLastSyncedCommitSha(sha: string): void` and `clearLastSyncedCommitSha(): void` functions in `github-settings.ts` using localStorage key `'my-cellar-last-synced-sha'`
- [x] Update `pushToGitHub` to return the new commit SHA on success (extend `SyncResult` type to include `commitSha?: string`)
- [x] Update `pullFromGitHub` to return the remote HEAD commit SHA on success (extend `SyncResult` type to include `commitSha?: string`)
- [x] Update `clearSettings()` in `github-settings.ts` to also call `clearLastSyncedCommitSha()`
- [x] Write unit tests for SHA storage functions (store, retrieve, clear, clear on disconnect)

2. **Add conflict detection to push flow** ✅
- [x] Add a `checkForConflict(client, repo, lastSyncedSha): Promise<ConflictCheckResult>` function in `github-sync.ts` that fetches remote HEAD SHA and compares with the stored last synced SHA
- [x] Define `ConflictCheckResult` type: `{ conflict: false } | { conflict: true; remoteSha: string }`
- [x] If `lastSyncedSha` is `null` (first sync ever), no conflict — proceed normally
- [x] Integrate conflict check at the start of `pushToGitHub`: if conflict detected, return a new `SyncResult` status `'conflict'`
- [x] Add `'conflict'` to the `SyncResult` status discriminated union in `types.ts`
- [x] Write unit tests for conflict detection (matching SHA, mismatched SHA, null SHA, empty repo)

3. **Update sync status to include 'conflict' state** ✅
- [x] Add `'conflict'` to the `SyncStatus` type in `types.ts`
- [x] Update `App.svelte` header to handle `'conflict'` status: display "Conflict" label in orange
- [x] Write test for conflict status rendering in App component

4. **Update sync manager to handle conflicts** ✅
- [x] In `attemptSync`, when push returns `'conflict'` status, dispatch `'conflict'` sync status and stop retrying (do not add to queue or schedule retry)
- [x] In `processQueue`, when push returns `'conflict'`, dispatch `'conflict'` sync status and stop processing
- [x] Store the last synced commit SHA after successful push/pull in sync manager
- [x] Write unit tests for sync manager conflict handling (conflict stops retry, conflict dispatches status)

5. **Implement conflict resolution: Create PR** ✅
- [x] Add `createConflictPR(client, repo, bottles): Promise<SyncResult>` function in `github-sync.ts`
- [x] Push local bottles to a new branch named `conflict/YYYY-MM-DD-HHmmss` (using current timestamp)
- [x] Create a PR from the conflict branch to the default branch with a descriptive title ("Resolve sync conflict - [date]") and body listing bottle count and action needed
- [x] On success, return `{ status: 'success', message: 'Pull request created: <PR URL>' }`
- [x] Write unit tests for PR creation (branch creation, PR creation, error handling)

6. **Implement conflict resolution: Overwrite local** ✅
- [x] This is largely the existing `pullFromGitHub` flow, but must also: clear sync queue, clear retry state, update last synced SHA, dispatch `'connected'` status
- [x] Create `resolveConflictWithRemote(client, repo): Promise<SyncResult>` function in `github-sync.ts` that orchestrates this
- [x] Write unit tests for overwrite resolution (pull, queue clear, SHA update, status dispatch)

7. **Create ConflictModal Svelte component** ✅
- [x] Create `src/components/ConflictModal.svelte` (≤150 lines)
- [x] Modal overlay with semi-transparent backdrop, centered card
- [x] Title: "Sync Conflict Detected"
- [x] Description: "The remote repository has changed since your last sync. Choose how to resolve:"
- [x] Option 1 button: "Create Pull Request" — calls `createConflictPR`, shows loading state, shows success message with PR URL or error
- [x] Option 2 button: "Use Remote Data" — calls `resolveConflictWithRemote`, shows loading state, dismisses on success
- [x] Dispatch `'conflict-resolved'` custom event on successful resolution
- [x] Write component tests (rendering, button clicks, loading states, event dispatch)

8. **Integrate ConflictModal into App.svelte** ✅
- [x] Show `ConflictModal` when `syncStatus === 'conflict'`
- [x] Listen for `'conflict-resolved'` event to update sync status to `'connected'` and dismiss modal
- [x] Pass required props (GitHub client, repo) to ConflictModal
- [x] Write integration test for conflict modal showing/hiding based on sync status

9. **Update SyncSection to store commit SHA after manual push/pull** ✅
- [x] After successful manual push in `SyncSection.svelte`, store the returned commit SHA via `setLastSyncedCommitSha`
- [x] After successful manual pull in `SyncSection.svelte`, store the returned commit SHA via `setLastSyncedCommitSha`
- [x] Write tests for SHA persistence after manual sync operations

10. **Verify all acceptance criterias** ✅
- [x] Run full test suite and verify all tests pass
- [x] Verify coding style compliance (component sizes, TypeScript strict, JSDoc)
- [x] Verify testing requirements (AAA pattern, coverage, mocked API)
- [x] Verify no new dependencies were added

11. **Update ROADMAP.md** ✅
- [x] Mark Step 9 items as completed

12. **Update CHANGELOG.md** ✅
- [x] Add entry for Conflict Resolution feature
