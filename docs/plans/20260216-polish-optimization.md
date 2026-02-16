# Feature: Polish & Optimization

Plan created at 2026-02-16

## Goal

Finalize the My Cellar app for production readiness by adding a full PWA experience (Service Worker + Web App Manifest for installability and offline asset caching), a toast notification system for user feedback, an audit of existing error handling, Playwright E2E tests for core user flows, and removal of the hard bundle size constraint. This step transforms the app from a working prototype into a polished, installable mobile application.

## Acceptance criterias

- [x] Test: Service Worker caches static assets (JS, CSS, HTML) and serves them offline
- [x] Test: Web App Manifest is valid and enables "Add to Home Screen" on mobile browsers
- [x] Test: App is installable as a PWA (manifest includes name, icons, start_url, display: standalone)
- [x] Test: Toast notifications appear for success actions (bottle added, sync completed)
- [x] Test: Toast notifications appear for error actions (sync failed, connection error)
- [x] Test: Toasts auto-dismiss after a configurable duration
- [x] Test: No unhandled promise rejections exist in async code paths (storage, sync, GitHub API)
- [x] Test: Playwright E2E test covers adding a new bottle end-to-end
- [x] Test: Playwright E2E test covers searching and filtering bottles
- [x] Test: Playwright E2E test covers consuming a bottle (if consume action exists in UI) — N/A, consume UI is out of scope
- [x] Test: All existing Vitest tests pass (354+ tests) — 378 tests passing
- [x] Test: Bundle size test constraint is removed from test suite
- [x] Coding style requirements are respected
- [x] Testing requirements are respected
- [x] Dependency management requirements are respected
- [x] Key decisions from the user are documented
- [x] Documentation is up-to-date and coherent
- [x] ROADMAP.md is updated
- [x] CHANGELOG.md is updated

## Out of scope

- **Code splitting / lazy loading**: The user chose to remove the bundle size hard limit rather than optimize. No code splitting needed.
- **Bundle size reduction**: Octokit stays as-is. No replacement with lighter alternatives.
- **Push notifications**: The PWA will cache assets and be installable but will not implement push notifications.
- **Background sync API**: Offline changes will continue using the existing sync queue with exponential backoff, not the Background Sync API.
- **Consume/remove bottle UI**: This is a separate backlog item. E2E tests will only cover flows that exist in the UI.

## Implementation Steps

1. **Remove bundle size hard limit** ✅
- [x] Remove bundle size test/constraint if one exists in the test suite
- [x] Update `docs/PROJECT.md` to remove or soften the ~50kb bundle size requirement
- [x] Update `docs/testing.md` to remove "Test bundle size constraints" requirement
- [x] Document decision in `docs/decisions/20260216-remove-bundle-size-limit.md`

2. **Add toast notification system** ✅
- [x] Create a `ToastContainer.svelte` component with support for success, error, and info variants
- [x] Create a toast store/manager (`src/lib/toast.svelte.ts`) for dispatching toasts programmatically
- [x] Integrate toasts into `App.svelte` (render toast container at root level)
- [x] Add toasts to Add Bottle flow (success on add, error on failure)
- [x] Add toasts to GitHub sync operations (push/pull success, sync error, conflict detected)
- [x] Add toasts to Settings (connection test success/failure, disconnect)
- [x] Write Vitest tests for toast store and Toast component

3. **Audit and improve error handling** ✅
- [x] Audit all `async` functions for missing try/catch or unhandled promise rejections
- [x] Audit all `.catch()` chains for silent failures (ensure user is notified via toast)
- [x] Ensure GitHub API errors surface meaningful messages to the user
- [x] Ensure IndexedDB errors are handled gracefully (storage full, permission denied)
- [x] Add global unhandled rejection handler in `main.ts` that shows an error toast
- [x] Write tests for error scenarios that were previously untested

4. **Add PWA support (Service Worker + Web App Manifest)** ✅
- [x] Create `public/manifest.json` with app name, icons, start_url (`/my-cellar/`), display: standalone, theme color
- [x] Create PWA icons (minimal set: 192x192 and 512x512 PNG)
- [x] Add manifest link and theme-color meta tag to `index.html`
- [x] Create Service Worker (`public/sw.js`) with cache-first strategy for static assets
- [x] Register Service Worker in `main.ts`
- [x] Handle Service Worker updates (notify user when new version is available)
- [x] Write Vitest tests for Service Worker registration logic
- [x] Verify PWA installability using Lighthouse or browser dev tools

5. **Add Playwright E2E tests** ✅
- [x] Install Playwright as a dev dependency
- [x] Configure Playwright (`playwright.config.ts`) with Chromium-only for speed
- [x] Add `npm run test:e2e` script to `package.json`
- [x] Write E2E test: Add a new bottle (fill form, submit, verify on dashboard)
- [x] Write E2E test: Search and filter bottles (add bottles, apply filters, verify results)
- [x] Write E2E test: Navigate between views (dashboard, add, search, settings)
- [x] Update backlog item "Consider adding Playwright for E2E testing" as resolved

6. **Verify all acceptance criterias** ✅
- [x] Run full Vitest test suite and confirm all tests pass (378 tests)
- [x] Run Playwright E2E tests and confirm all pass (5 tests)
- [x] Verify PWA installability on a mobile browser
- [x] Review coding style compliance
- [x] Review testing requirements compliance
- [x] Review dependency management compliance

7. **Update ROADMAP.md** ✅
- [x] Mark Step 11 as completed with all sub-items checked

8. **Update CHANGELOG.md** ✅
- [x] Add entry for Step 11 summarizing all changes
