# Roadmap

Updated at 2026-02-17

## Step 1: Project Setup & Foundation ✅
- [x] Initialize Svelte + Vite project with mobile-first configuration
- [x] Configure build for minimal bundle size optimization (~15-20kb target)
- [x] Set up GitHub Pages deployment workflow
- [x] Create basic responsive layout shell with navigation

## Step 2: Data Model & Local Storage ✅
- [x] Define TypeScript types for bottle schema and history entries
- [x] Implement localStorage/IndexedDB wrapper for offline data persistence
- [x] Create utility functions to calculate current quantity from history
- [x] Implement duplicate detection logic (type + vintage + name matching)

## Step 3: Dashboard View ✅
- [x] Create dashboard layout with inventory statistics (total bottles, breakdown by type)
- [x] Display recent activity feed with last 10 history entries and top 3 regions
- [x] Add persistent sync status indicator (placeholder "Offline" badge)
- [x] Ensure mobile-optimized responsive design with empty state and CTA

## Step 4: Add Bottle Functionality ✅
- [x] Create add bottle form with all required fields (name, vintage, type, etc.)
- [x] Implement duplicate detection flow (update existing vs create new)
- [x] Add history entry creation for "added" action with price/currency support
- [x] Form validation and error handling

## Step 5: Search & Filter ✅
- [x] Create search/filter UI with mobile-optimized controls
- [x] Implement filtering by type, country, region, vintage, and rating
- [x] Display filtered results in responsive grid/list
- [x] Add clear filters and search state management

## Step 6: GitHub Integration - Settings & Authentication ✅
- [x] Create settings view for GitHub configuration
- [x] Implement secure storage of GitHub repo URL and PAT in localStorage
- [x] Create GitHub API client with PAT authentication
- [x] Add connection testing and validation

## Step 7: GitHub Sync - Push & Pull ✅
- [x] Implement push: Write local bottles to GitHub as JSON files (wines/{type}/wine-{uuid}.json)
- [x] Implement pull: Read bottles from GitHub into local storage
- [x] Create file organization structure by wine type
- [x] Update sync status indicator to show active syncing state

## Step 8: Offline Capability & Sync Queue ✅
- [x] Implement offline detection and status display
- [x] Queue local changes when offline (add, update, consume actions)
- [x] Auto-sync queued changes when connection restored
- [x] Update sync status to reflect in-sync/error states

## Step 9: Conflict Resolution ✅
- [x] Detect sync conflicts (outdated local state vs remote changes)
- [x] Create conflict resolution UI with two options
- [x] Implement Option 1: Create GitHub pull request for manual resolution
- [x] Implement Option 2: Overwrite local data with GitHub state

## Step 10: Autocomplete for Duplicate Prevention ✅
- [x] Implement name-based autocomplete in Add Bottle form
- [x] Display matching bottles as dropdown suggestions while typing
- [x] Show info message when user selects an existing bottle
- [x] Auto-fill selected bottle data with read-only fields for non-key attributes
- [x] Reactive duplicate re-detection when name, vintage, or type changes
- [x] Keyboard-accessible dropdown navigation (arrow keys, Enter, Escape)

## Step 11: Polish & Optimization ✅
- [x] Remove bundle size hard limit (Svelte + Vite + Tailwind are inherently lightweight)
- [x] Toast notification system for user feedback (success, error, info variants)
- [x] Comprehensive error handling audit with global unhandled rejection handler
- [x] Full PWA support (Service Worker, Web App Manifest, installability)
- [x] Playwright E2E tests for core user flows (add bottle, search, navigation)

## Step 12: Autocomplete for Country & Region ✅
- [x] Create generic TextAutocomplete component (show on focus, filter while typing, keyboard-accessible)
- [x] Implement autocomplete dropdown for Country field in Add Bottle form
- [x] Implement autocomplete dropdown for Region field in Add Bottle form
- [x] Extract existing values from current bottles to populate suggestion lists
- [x] Allow free-text entry for new values while suggesting existing ones

## Step 13: Update Bottle Rating & Notes ✅
- [x] Create bottle detail view (full-page modal) with all fields and history timeline
- [x] Create edit bottle modal with key fields disabled and non-key fields editable
- [x] Add detail/edit action from dashboard (recent bottles) and search results
- [x] Implement form validation (rating 1-10, optional) and save functionality
- [x] Key fields (name, vintage, type) are visible but disabled — no duplicate re-validation needed
- [x] Update sync to push changes to GitHub via attemptSync()

## Step 14: Quick Consume/Remove Actions ✅
- [x] Add consume action button to bottle cards in dashboard view
- [x] Add consume action button to bottle cards in search results
- [x] Add remove action button to bottle cards in dashboard and search views
- [x] Add consume/remove buttons to bottle detail modal
- [x] Update history and sync changes to GitHub

## Step 15: Manual Sync with Queue Counter ✅
- [x] Remove auto-sync behavior from all change operations (add, consume, edit, remove)
- [x] Queue all local changes (create, update, delete) to sync queue in IndexedDB
- [x] Display queued item count badge on sync icon (e.g., "3" for 3 pending changes)
- [x] Implement manual push on sync icon click when queue has items
- [x] Implement manual pull on sync icon click when queue is empty
- [x] Update sync status indicator to show "N changes pending" state

## Step 16: Drinking Window (Consume Starting From)
- [ ] Add "consumeStartingFrom" field to bottle data model (year format: YYYY)
- [ ] Add optional year input field to Add Bottle form
- [ ] Display drinking window indicator on bottle cards (e.g., "Drink from 2028")
- [ ] Include field in edit bottle functionality (Step 13)
- [ ] Add visual indicator for bottles ready to drink vs aging
- [ ] Add "Bottles to Drink This Year" section on dashboard (consumeStartingFrom ≤ current year)
