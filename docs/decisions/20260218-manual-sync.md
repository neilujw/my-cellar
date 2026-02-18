# Feature Manual Sync with Queue Counter

Decision made on 2026-02-18

## Feature overview

Step 15 replaces automatic post-mutation sync with a fully manual model. Every local change is queued in IndexedDB; the user explicitly taps a sync icon in the header to push or pull.

## Context

The current implementation calls `attemptSync()` after every bottle mutation (add, consume, edit, remove), which immediately pushes the full collection to GitHub. When offline or on error, it schedules automatic retries with exponential backoff (up to 10 retries over ~60s). The sync controls (Push/Pull) also exist in Settings. The header shows a text label indicating sync state.

## Decision

**1. Sync is fully manual — no auto-sync, no retries.**
Every mutation only writes to IndexedDB and adds one entry to the sync queue. The user decides when to sync by tapping the header icon. If a manual push fails, an error toast is shown and the queue is preserved. The user retries by tapping again. Rationale: simpler mental model, lower noise, avoids unexpected API calls on every action.

**2. Sync icon in header replaces the text label.**
The current text-only `<span>` is replaced by a new `SyncButton` component: a clickable SVG icon button with a numeric badge showing pending count. Rationale: touch-friendly, immediately visible pending count, matches the roadmap description of a "sync icon".

**3. Single context-aware sync button: push when queue has items, pull when empty.**
The same button performs push or pull depending on queue state. The badge and icon clearly indicate which action will occur ("N pending" + upload arrow vs. "Synced" + download arrow). Rationale: minimizes header real estate, keeps the interaction simple.

**4. Settings SyncSection becomes "Force Push (create PR)" and "Force Pull (overwrite local)".**
The normal Push/Pull buttons in Settings are renamed to reflect destructive/override intent. Force Push creates a GitHub PR with local state (calls `createConflictPR()` directly, bypassing SHA check). Force Pull overwrites local data with the remote state (same as current Pull). These are power-user actions for recovery scenarios. Rationale: the header button handles normal sync; Settings handles exceptional recovery.

**5. `cancelRetries()` is kept as a no-op stub.**
`ConflictModal.svelte` still calls `cancelRetries()`. Rather than touching unrelated code, the function is kept but made a no-op. Rationale: minimal blast radius.
