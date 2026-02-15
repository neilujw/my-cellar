# Feature: GitHub Integration - Settings & Authentication

Plan created at 2026-02-15

## Goal

Implement the Settings view where users configure their GitHub private repository connection (owner/repo format) and Personal Access Token (PAT). The view allows testing the connection (verifying PAT validity and read/write access), persisting credentials in plain localStorage, and disconnecting. This is the foundation for all subsequent sync features (Steps 7-9).

## Acceptance criterias

- [x] Settings view displays a form with two fields: repository (owner/repo format) and PAT
- [x] Repository field validates the owner/repo format (non-empty owner and repo, no spaces, valid characters)
- [x] PAT field is a password-type input (masked by default)
- [x] "Test Connection" button calls GitHub API to verify: PAT is valid, repo exists, and PAT has read+write access
- [x] Success feedback: green success message displayed after successful connection test
- [x] Error feedback: descriptive error message displayed for invalid PAT, missing repo, or insufficient permissions
- [x] "Save" button persists repo URL and PAT to localStorage
- [x] Settings are loaded from localStorage on view mount (pre-fill form if previously configured)
- [x] "Disconnect" button clears stored PAT and repo from localStorage and resets the form
- [x] GitHub API client module (`github-client.ts`) created using Octokit with PAT authentication
- [x] GitHub API client exposes a `testConnection` function that verifies repo access and read/write permissions
- [x] Sync status indicator in the header updates from "Offline" to "Connected" when settings are saved and tested, or "Not configured" when no settings exist
- [x] All tests pass
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented

## Out of scope

- **Push/pull sync logic**: Actual data sync is Step 7. This step only establishes the connection.
- **Offline queue**: Offline change tracking is Step 8.
- **Conflict resolution**: Conflict detection and resolution is Step 9.
- **PAT encryption**: PAT is stored in plain localStorage per user decision. Client-side encryption would be security theater.
- **OAuth flow**: Only PAT-based authentication is supported per PROJECT.md requirements.
- **Repository creation**: User must create the private GitHub repo manually. The app only connects to an existing repo.

## Implementation Steps

1. Install Octokit dependency
- [x] Add `octokit` (pinned exact version) to package.json
- [x] Verify it integrates with Vite build

2. Update bundle size target in project docs
- [x] Update PROJECT.md: change ~15-20kb to ~50kb
- [x] Update testing.md: change bundle size test threshold from 25kb to 50kb
- [x] Update BACKLOG.md: mark "Discuss bundle size strategy" as resolved, update "Monitor Tailwind CSS" target
- [x] Document bundle size target decision in `docs/decisions/20260215-bundle-size-target.md`

3. Create GitHub settings types
- [x] Add `GitHubSettings` interface to `types.ts` (repo: string as owner/repo, pat: string)
- [x] Add `ConnectionStatus` type to `types.ts` (discriminated union: 'not-configured' | 'connected' | 'error')
- [x] Add `SyncStatus` type update to reflect new states

4. Create GitHub settings storage utilities
- [x] Create `src/lib/github-settings.ts` with functions: `saveSettings`, `loadSettings`, `clearSettings`
- [x] Use localStorage with a dedicated key (e.g., `my-cellar-github-settings`)
- [x] `saveSettings` stores repo and PAT
- [x] `loadSettings` returns stored settings or null
- [x] `clearSettings` removes stored settings
- [x] Write tests for all storage functions

5. Create GitHub API client
- [x] Create `src/lib/github-client.ts` using Octokit
- [x] Export `createGitHubClient(pat: string)` factory function
- [x] Export `testConnection(client, repo: string)` that:
  - Fetches repo metadata to verify access
  - Attempts to read repo contents to verify read permission
  - Returns success or typed error (invalid PAT, repo not found, insufficient permissions)
- [x] Write tests with mocked Octokit responses (happy path, invalid PAT, missing repo, no write access)

6. Create settings form validation
- [x] Create `src/lib/settings-utils.ts` with validation functions
- [x] Validate repo format: must match `owner/repo` pattern (alphanumeric, hyphens, underscores, dots)
- [x] Validate PAT: non-empty string
- [x] Write tests for validation functions

7. Implement Settings view
- [x] Replace placeholder in `src/views/Settings.svelte` with full form
- [x] Form fields: repository (text input with placeholder "owner/repo"), PAT (password input)
- [x] "Test Connection" button with loading state and result feedback (success/error message)
- [x] "Save" button to persist settings (enabled only after successful connection test)
- [x] "Disconnect" button (visible only when settings are saved) to clear settings
- [x] Pre-fill form from localStorage on mount
- [x] Mobile-friendly layout consistent with other views
- [x] Write component tests

8. Update sync status indicator
- [x] Update `App.svelte` header to show dynamic sync status based on stored settings
- [x] "Not configured" when no settings exist
- [x] "Connected" when settings are saved and last test succeeded
- [x] "Offline" kept for future use (Step 8)
- [x] Write tests for status display logic

9. Update ROADMAP.md
- [x] Mark Step 6 items as completed

10. Update CHANGELOG.md
- [x] Add entry for GitHub Settings & Authentication feature
