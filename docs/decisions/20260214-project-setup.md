# Feature: Project Setup & Foundation

Decision made on 2026-02-14

## Feature overview
Initial project setup for My Cellar — a Svelte 5 wine cellar tracking app deployed to GitHub Pages.

## Context
Several technology choices needed to be made for the project foundation: Svelte version, CSS approach, routing strategy, package manager, deployment method, navigation pattern, and testing framework.

## Decision

### Svelte 5 with runes
Svelte 5 was chosen for its improved performance, smaller bundle size, and modern runes-based reactivity model. This aligns with the project's goal of minimal bundle size.

### Tailwind CSS
Tailwind CSS was chosen for styling. While it adds build complexity, its utility-first approach enables fast prototyping and produces small production bundles when purged. The bundle size impact will be monitored against the 15-20kb target during Step 10 optimization.

### Hash-based custom router
A custom hash-based router was chosen over a library dependency. Hash routing (`#/dashboard`, `#/add`, etc.) works natively with GitHub Pages static hosting without any server-side configuration. A custom implementation keeps the bundle small and avoids unnecessary dependencies for an app with only 4 routes.

### npm package manager
npm was chosen as the package manager for its wide support and zero additional installation requirements.

### GitHub Actions deployment
Automated deployment via GitHub Actions was chosen. The workflow triggers on push to `main` and deploys to GitHub Pages, ensuring the app is always up-to-date without manual intervention.

### Bottom tab bar navigation
A mobile-standard bottom tab bar with 4 tabs (Dashboard, Add, Search, Settings) was chosen for the navigation shell. This is the most thumb-friendly pattern for mobile-first apps and provides immediate access to all views.

### Vitest for testing
Vitest was chosen as the test framework for its native integration with Vite, fast execution, and Jest-compatible API. End-to-end testing with Playwright was deferred — it can be added later if needed.
