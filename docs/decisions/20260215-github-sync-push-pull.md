# Feature: GitHub Sync - Push & Pull

Decision made on 2026-02-15

## Feature overview
Manual push and pull sync operations between local IndexedDB storage and a private GitHub repository, using atomic Git commits with incremental diffs for clean GitHub history.

## Context
Step 7 of the roadmap requires implementing the actual data sync between the local cellar and the GitHub repository configured in Step 6. Several decisions were needed about sync triggers, push strategy, pull strategy, delete handling, and commit messages.

## Decision
- **Sync trigger**: Manual only for Step 7. Push and Pull buttons in the Settings view next to existing connection controls. Auto-sync on events (add/remove, app load) deferred to Step 8.
- **Push strategy**: Incremental push — only push what changed compared to GitHub's current state. Use the Git Data API (trees + commits) to create a single atomic commit per push, producing clean, diff-friendly GitHub history.
- **Pull strategy**: Full replace — pull replaces all local data with GitHub data. GitHub is the source of truth per PROJECT.md requirements.
- **Delete sync**: Full mirror — push makes GitHub an exact mirror of local state. Bottles deleted locally have their JSON files removed from GitHub.
- **Commit messages**: Auto-generated descriptive summaries listing what changed (e.g., "Add Château Margaux 2015, remove Puligny 2020"). Good for browsing GitHub history.
