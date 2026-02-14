# Feature Dashboard View

Decision made on 2026-02-14

## Feature overview
The dashboard is the default landing page of the wine cellar app. It provides an at-a-glance overview of the collection with statistics and recent activity.

## Context
During planning of the Dashboard View (Roadmap Step 3), several design decisions were made about what information to display and how to present it. The goal was to keep the dashboard useful without overloading the user or duplicating functionality planned for other views (Search, Settings).

## Decision
- **Statistics**: Display total bottle count, breakdown by wine type (red/white/rosé/sparkling), and top 3 regions by bottle count. Countries were excluded to keep it concise; regions provide more actionable insight for a wine cellar.
- **Main content**: Show the 10 most recent activity entries (added/consumed/removed) in a compact format (`date • action • quantity × name vintage`) instead of a full bottle list. The full cellar list is deferred to the Search & Filter view (Step 5).
- **Empty state**: When no bottles exist, display a friendly message with a call-to-action button navigating to the Add Bottle view, guiding new users.
- **Sync status**: Keep a simple "Offline" text badge as placeholder in the header. Real sync status management is deferred to Steps 6-9.
