# Feature: GitHub Sync - Push & Pull

Plan created at 2026-02-15

## Goal

Implement manual push and pull sync operations between local IndexedDB and the user's private GitHub repository. Push creates a single atomic Git commit containing only the incremental changes (added, modified, or deleted bottles) for a clean, diff-friendly GitHub history. Pull replaces all local data with the current GitHub state (source of truth). Both operations are triggered manually via buttons in the Settings view.

## Acceptance criterias

- [x] Push uploads all local bottles to GitHub as `wines/{type}/wine-{uuid}.json` files
- [x] Push creates a single atomic Git commit (not one commit per file)
- [x] Push is incremental: only changed, added, or deleted files are included in the commit
- [x] Push deletes files from GitHub for bottles that no longer exist locally (full mirror)
- [x] Push generates a descriptive commit message summarizing the changes (e.g., "Add Château Margaux 2015, update Puligny 2020")
- [x] Push does nothing (no empty commit) when local state matches GitHub state
- [x] Push preserves non-wine files in the repository (e.g., README)
- [x] Pull reads all `wines/**/*.json` files from GitHub and parses them into Bottle objects
- [x] Pull replaces all local IndexedDB data with the pulled bottles (full replace)
- [x] Pull handles an empty repository gracefully (no wines directory → empty cellar)
- [x] Push and Pull buttons are visible in the Settings view when settings are saved
- [x] Push and Pull buttons show loading state during operation
- [x] Success feedback is displayed after successful push or pull
- [x] Error feedback with descriptive message is displayed on failure
- [x] Sync status indicator in the header shows "Syncing" during push/pull operations
- [x] JSON files are pretty-printed (2-space indent) with consistent key ordering for diff-friendliness
- [x] Push handles first-time push to an empty repository (no existing commits)
- [x] All tests pass
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented

## Out of scope

- **Auto-sync on events**: Automatic push after add/remove or auto-pull on app load is Step 8. This step only provides manual push/pull.
- **Offline detection**: Detecting online/offline status and queuing changes is Step 8.
- **Conflict resolution**: Detecting and resolving conflicts (e.g., two devices pushing different changes) is Step 9. Step 7's push overwrites GitHub state.
- **Branch selection**: Always uses the repository's default branch. No branch picker UI.
- **Selective sync**: No ability to push/pull individual bottles. Always syncs the entire cellar.
- **Progress indicator**: No per-file progress bar. Just a loading state on the button.

## Implementation Steps

1. Update SyncStatus type
- [x] Add `'syncing'` to the `SyncStatus` union type in `types.ts`
- [x] Add `SyncResult` type: discriminated union of `{ status: 'success'; message: string }` and `{ status: 'error'; message: string }`
- [x] Update `syncStatusLabels` and `syncStatusColors` in `App.svelte` for the new `'syncing'` state

2. Create bottle serialization utilities
- [x] Create `src/lib/bottle-serializer.ts`
- [x] Export `bottleToFilePath(bottle)`: generates `wines/{type}/wine-{uuid}.json` path
- [x] Export `serializeBottle(bottle)`: produces pretty-printed JSON (2-space indent, trailing newline) with consistent key ordering matching the PROJECT.md schema
- [x] Export `deserializeBottle(json)`: parses JSON string into a validated `Bottle` object, returning `null` for invalid data
- [x] Write tests for serialization round-trip, key ordering consistency, file path generation, deserialization of valid and invalid data

3. Create GitHub sync module — push
- [x] Create `src/lib/github-sync.ts`
- [x] Export `pushToGitHub(client, repo, bottles)` that:
  - Gets the default branch name from repo metadata
  - Gets the latest commit SHA and tree SHA from the default branch ref
  - Fetches the current tree (recursive) to find existing wine files
  - Compares local bottles against remote wine files to compute diff (added, modified, deleted)
  - If no changes, returns early with a "no changes" result
  - Builds a new tree: preserves non-wine entries from the current tree, adds/updates wine file entries with content, omits deleted wine files
  - Creates a commit with an auto-generated descriptive message
  - Updates the branch ref to the new commit
- [x] Handle first-time push to an empty repository (no existing commits): create initial tree and commit
- [x] Export `generateCommitMessage(added, modified, deleted)` helper for auto-generated messages
- [x] Write tests with mocked Octokit: happy path push, no-changes push, first-time empty repo push, push with deletes, error handling

4. Create GitHub sync module — pull
- [x] Export `pullFromGitHub(client, repo)` in `src/lib/github-sync.ts` that:
  - Gets the default branch name from repo metadata
  - Gets the latest commit SHA and tree SHA
  - Fetches the current tree (recursive) to find all wine files (`wines/**/*.json`)
  - Fetches the content of each wine file (via blob API, parallelized in batches)
  - Deserializes each file into a Bottle object (skips invalid files with a warning)
  - Returns the array of valid bottles
- [x] Handle empty repository (no commits or no wines directory): return empty array
- [x] Write tests with mocked Octokit: happy path pull, empty repo pull, invalid file handling, error handling

5. Add sync UI to Settings view
- [x] Add a "Data Sync" section to `Settings.svelte` (visible only when settings are saved)
- [x] Add "Push" button that calls `pushToGitHub` with all local bottles from IndexedDB
- [x] Add "Pull" button that calls `pullFromGitHub` and replaces all local IndexedDB data
- [x] Both buttons show loading state during operation and are disabled while syncing
- [x] Display success message after successful push/pull (e.g., "Pushed 12 bottles to GitHub" or "Pulled 10 bottles from GitHub")
- [x] Display error message on failure
- [x] Dispatch `sync-status-changed` event to update header indicator during sync
- [x] Ensure the Settings.svelte component stays under the 150-line limit (extract sync section into a sub-component if needed)
- [x] Write component tests for sync buttons, loading states, success/error feedback

6. Update sync status indicator for syncing state
- [x] Update `App.svelte` to listen for `sync-status-changed` events
- [x] Show "Syncing..." label with appropriate color during push/pull
- [x] Revert to previous status (Connected/Not configured) after sync completes
- [x] Write tests for syncing status transitions

7. Update ROADMAP.md
- [x] Mark Step 7 items as completed

8. Update CHANGELOG.md
- [x] Add entry for GitHub Sync - Push & Pull feature
