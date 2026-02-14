# Feature Data Model & Local Storage

Decision made on 2026-02-14

## Feature overview
Local data persistence layer for the wine cellar app, storing bottle data for offline access and as a cache before syncing with GitHub.

## Context
The app needs local storage to persist bottle data in the browser for offline capability. Two main options were considered: localStorage (simple, synchronous, 5MB limit, string-only) and IndexedDB (structured, async, 100MB+ capacity). For ~100 bottles either works, but IndexedDB is more robust for structured JSON data and future growth (offline sync queue, large collections).

## Decision
Use IndexedDB as the local storage mechanism, with the `idb` library (~1kb gzipped) as a thin Promise wrapper over the raw API. IndexedDB provides structured storage with indexes for efficient querying, and `idb` eliminates the boilerplate of the raw callback-based API while adding negligible bundle size.
