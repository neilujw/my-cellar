# Feature: Remove Bundle Size Hard Limit

Decision made on 2026-02-16

## Feature overview
Remove the hard bundle size constraint (50 KB gzipped) from the project requirements and test suite.

## Context
The current bundle is 57.5 KB gzipped (JS: 53.7 KB + CSS: 3.78 KB), slightly above the 50 KB target that was already raised from the original 15-20 KB during Step 6. The overshoot is primarily due to Octokit (~20 KB) which is essential for GitHub sync. Options considered were: (1) dynamic import Octokit to reduce initial bundle, (2) raise the target to 60 KB, or (3) remove the hard limit entirely.

## Decision
Remove the hard bundle size limit entirely. The tech stack (Svelte + Vite + Tailwind) is inherently lightweight, and Octokit is essential. The user trusts that the current approach produces a reasonably sized bundle without needing a numeric constraint. Bundle size monitoring remains possible via build output but is no longer enforced as a test.
