# Feature: Project Setup & Foundation

Plan created at 2026-02-14

## Goal

Initialize the My Cellar project with Svelte 5, Vite, Tailwind CSS, and Vitest. Set up a mobile-first responsive layout shell with bottom tab bar navigation, hash-based routing for the 4 application views, and automated GitHub Pages deployment via GitHub Actions. This establishes the foundation for all subsequent features.

## Acceptance criterias

- [x] `npm install` completes without errors
- [x] `npm run dev` starts a local dev server that serves the app
- [x] `npm run build` produces a production build in `dist/`
- [x] `npm run test` runs Vitest and all tests pass (13/13)
- [x] Production build gzipped size is under 50kb (~18.26 kB total)
- [x] App renders a bottom tab bar with 4 tabs: Dashboard, Add, Search, Settings
- [x] Clicking each tab navigates to the corresponding view via hash routing (`#/`, `#/add`, `#/search`, `#/settings`)
- [x] Browser back/forward buttons work with hash routing
- [x] Directly loading a hash URL (e.g. `#/settings`) renders the correct view
- [x] Layout is responsive and renders correctly on mobile viewports (375px width)
- [x] A sync status placeholder is visible in the header area on all views
- [x] GitHub Actions workflow file exists at `.github/workflows/deploy.yml`
- [x] Workflow triggers on push to `main` and deploys to GitHub Pages
- [x] Tailwind CSS utility classes are functional and purged in production build
- [x] All coding style requirements are respected
- [x] All testing requirements are respected
- [x] All dependency management requirements are respected
- [x] Key decisions from the user are documented in `docs/decisions/`
- [x] `ROADMAP.md` is updated when all implementation steps are done
- [x] `CHANGELOG.md` is updated when all implementation steps are done

## Out of scope

- **IndexedDB/localStorage setup**: Will be handled in Step 2 (Data Model & Local Storage)
- **Actual view content**: Views will be placeholder stubs — real content comes in Steps 3-6
- **GitHub API integration**: Will be handled in Step 6
- **PWA/service worker**: Not part of the initial setup; can be considered in Step 8 (Offline Capability)
- **Dark mode**: Not in project requirements

## Implementation Steps

1. **Initialize Svelte 5 + Vite project**
   - [x] Run `npm create vite@latest` with Svelte template (or `npm create svelte@latest`)
   - [x] Ensure Svelte 5 with runes mode is configured
   - [x] Verify `npm install` and `npm run dev` work

2. **Install and configure Tailwind CSS**
   - [x] Install Tailwind CSS v4 and its Vite plugin
   - [x] Configure `app.css` with Tailwind imports
   - [x] Add base mobile-first styles (viewport meta tag, box-sizing, font stack)

3. **Set up Vitest**
   - [x] Install Vitest and `@testing-library/svelte`
   - [x] Configure `vitest.config.ts` (or extend `vite.config.ts`)
   - [x] Add a smoke test that verifies the app renders
   - [x] Add `"test"` script to `package.json`

4. **Create hash-based router**
   - [x] Implement a simple hash router module (`src/lib/router.svelte.ts`)
   - [x] Use Svelte 5 runes (`$state`, `$derived`) for reactive current route
   - [x] Listen to `hashchange` event and parse route from `window.location.hash`
   - [x] Export a `navigate(path)` function and a `currentRoute` reactive state
   - [x] Support routes: `/` (dashboard), `/add`, `/search`, `/settings`

5. **Create placeholder view components**
   - [x] `src/views/Dashboard.svelte` — placeholder with "Dashboard" heading
   - [x] `src/views/AddBottle.svelte` — placeholder with "Add Bottle" heading
   - [x] `src/views/Search.svelte` — placeholder with "Search" heading
   - [x] `src/views/Settings.svelte` — placeholder with "Settings" heading

6. **Create layout shell with bottom tab bar**
   - [x] `src/App.svelte` — main layout with header, content area, and bottom tab bar
   - [x] Header: app title "My Cellar" + sync status placeholder indicator
   - [x] Content area: renders current view based on router state
   - [x] Bottom tab bar: 4 tabs with icons/labels, highlights active tab
   - [x] Mobile-first responsive styling (full width, no unnecessary padding)

7. **Configure Vite for optimized builds**
   - [x] Set `base` path for GitHub Pages (e.g., `/my-cellar/`)
   - [x] Enable minification and tree-shaking (Vite defaults)
   - [x] Verify production build size

8. **Set up GitHub Actions deployment workflow**
   - [x] Create `.github/workflows/deploy.yml`
   - [x] Trigger on push to `main` branch
   - [x] Steps: checkout, install deps, build, deploy to GitHub Pages
   - [x] Use `actions/deploy-pages` for deployment

9. **Write tests**
   - [x] Test: router navigates correctly between routes
   - [x] Test: hash changes update the current route state
   - [x] Test: App renders the correct view for each route
   - [x] Test: bottom tab bar renders 4 tabs
   - [x] Test: sync status placeholder is visible
