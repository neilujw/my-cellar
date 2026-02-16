# Feature: Playwright E2E Testing

Decision made on 2026-02-16

## Feature overview
Adding Playwright for end-to-end browser testing of core user flows.

## Context
The project has 354 Vitest unit/integration tests providing good coverage of business logic and component behavior. However, there are no real browser tests that verify complete user flows in an actual browser environment. The backlog flagged this as a consideration. Options were: (1) continue with Vitest + testing-library only, or (2) add Playwright for real browser E2E tests.

## Decision
Add Playwright for E2E testing, scoped to core flows only: adding a bottle, searching/filtering bottles, and view navigation. GitHub sync flows are excluded from E2E tests because they require real API access or complex network mocking. Playwright will use Chromium-only configuration for speed. A new `npm run test:e2e` script will be added alongside the existing `npm run test` for unit/integration tests.
