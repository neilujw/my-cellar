# Feature Conflict Resolution

Decision made on 2026-02-15

## Feature overview
Sync conflict detection and resolution for the wine cellar app, enabling users to handle cases where the remote GitHub repository has diverged from local state.

## Context
When the user pushes local changes to GitHub, the remote repository may have changed since the last sync (e.g., changes made from another device or browser tab). The app needs a mechanism to detect this divergence and give the user control over how to resolve it. Several design choices were evaluated: conflict detection method, conflict granularity, PR creation approach, pending queue handling, UI placement, and sync status representation.

## Decision

**Detection mechanism**: Track the last synced remote commit SHA in localStorage after each successful push or pull. Before pushing, compare the current remote HEAD SHA against the stored SHA. If they differ, a conflict is detected. This is simple, reliable, and avoids the overhead of content-level comparison.

**Conflict granularity**: Whole-repo level. Conflicts are detected as "remote has changed" rather than identifying per-bottle differences. This aligns with the project's simplicity philosophy and is appropriate for a single-user app where conflicts are rare.

**PR creation**: When the user chooses to create a PR, local bottles are pushed to a timestamped branch (`conflict/YYYY-MM-DD-HHmmss`) and a pull request is automatically created against the default branch. The user resolves the conflict in GitHub's UI.

**Overwrite local**: When the user chooses to use remote data, all local bottles are replaced with the remote state, the sync queue is cleared (discarding pending changes), and the retry state is reset. The user explicitly accepts losing local uncommitted changes.

**Conflict UI**: A modal dialog that overlays the current view, ensuring the conflict is immediately visible and must be addressed before continuing. The modal presents both resolution options with loading states and feedback.

**Sync status**: A new `'conflict'` state is added to `SyncStatus` with an orange indicator in the header, distinct from both `'error'` (red) and `'offline'` (amber), making conflicts immediately recognizable.
