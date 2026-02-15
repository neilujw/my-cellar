# Feature: Bundle Size Target Update

Decision made on 2026-02-15

## Feature overview
Update the project's gzipped bundle size target from 15-20kb to 50kb.

## Context
The current production build is ~18kb gzipped. Adding Octokit for GitHub integration (~10kb gzipped) plus upcoming sync, offline queue, and conflict resolution features would push the bundle well beyond the original 15-20kb target. A decision was needed on whether to keep the target with code splitting, switch to a lighter API client, or raise the target.

## Decision
Raise the bundle size target to 50kb gzipped. This accommodates Octokit and all planned features (sync, offline queue, conflict resolution) while remaining well within acceptable mobile performance thresholds. The original 15-20kb was aspirational and no longer realistic given the feature set. Final optimization will still occur in Step 10.
