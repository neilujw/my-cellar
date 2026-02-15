# My Cellar - Wine Cellar Tracking App

A personal wine cellar management application that prioritizes data ownership and privacy. Track your wine collection (~100 bottles), maintain a complete history of additions/removals/consumption, and rate/annotate wines over time. Built as a mobile-friendly static web app with data synced to a private GitHub repository, ensuring you always own and control your data without vendor lock-in or subscription fees.

## Tech Stack

- **Frontend Framework**: Svelte + Vite
- **Hosting**: GitHub Pages (public repo for app code)
- **Data Storage**: Private GitHub repository (one JSON file per bottle)
- **Data Sync**: GitHub API with Personal Access Token (PAT)
- **Local Storage**: Browser localStorage/IndexedDB for offline work
- **Deployment**: Static site export to GitHub Pages

## Requirements

- **Data Ownership**: All wine data stored in user's private GitHub repository as the single source of truth. User maintains full control and can export/migrate data at any time.

- **Privacy**: Wine collection data remains private (private GitHub repo). Application code can be public, but personal data is never shared or accessible to third parties.

- **Mobile-First**: Primary access via mobile phone browser. UI must be responsive and optimized for mobile performance with minimal bundle size (~50kb).

- **Low Maintenance**: No server infrastructure to maintain, no databases to manage, no ongoing hosting costs. Simple static site deployment.

- **Offline Capability**: Data cached locally in browser for offline viewing and editing. Changes sync to GitHub when connection is available. GitHub repo is always the source of truth.

- **Sync Status Visibility**: Always display current sync state (in-sync, syncing, conflict, error) so user knows data consistency status.

- **Conflict Resolution**: When sync conflicts occur (outdated local state), provide two options: (1) create pull request for manual resolution, or (2) overwrite local copy with GitHub state.

- **No External Dependencies**: No third-party services, no external databases, no API keys except GitHub PAT stored locally in browser.

- **Currency Support**: Price tracking with currency awareness, defaulting to EUR but supporting multiple currencies.

- **Duplicate Prevention**: Adding an existing bottle (matched by type + vintage + name) should update history, not create duplicate entries.

## Data Model

**File Organization:**
- Wines organized by type: `wines/red/`, `wines/white/`, `wines/rosé/`, `wines/sparkling/`
- One JSON file per unique bottle: `wines/{type}/wine-{uuid}.json`
- Duplicate matching criteria: `type + vintage + name`

**Bottle Schema:**
```json
{
  "id": "uuid",
  "name": "Château Margaux",
  "vintage": 2015,
  "type": "red",
  "country": "France",
  "region": "Bordeaux",
  "grapeVariety": ["Cabernet Sauvignon", "Merlot"],
  "location": "Rack A, Shelf 2",
  "rating": 8.5,
  "notes": "Exceptional wine, pair with red meat",
  "history": [
    {
      "date": "2024-01-15",
      "action": "added",
      "quantity": 3,
      "price": {"amount": 45.00, "currency": "EUR"},
      "notes": "Bought at local wine shop"
    },
    {
      "date": "2024-06-10",
      "action": "consumed",
      "quantity": 1,
      "notes": "Dinner party"
    }
  ]
}
```

**Field Details:**
- `type`: Enum: "red", "white", "rosé", "sparkling"
- `location`: Optional field for physical cellar location
- `rating`: Optional, scale 1-10
- `notes`: Bottle-level notes (can be updated, no history tracking)
- `grapeVariety`: Array of grape varieties
- `history.action`: Enum: "added", "consumed", "removed"
- Current quantity is derived from history (sum of added - consumed - removed)

## Application Views

1. **Dashboard (Default)**: Overview of cellar with current inventory, statistics, and sync status
2. **Add Bottle**: Form to add new bottles or update quantity of existing bottles
3. **Search**: Search and filter wines by type, country, region, vintage, rating
4. **Settings**: Configure GitHub repository URL, PAT token, sync preferences

**Sync Status**: Persistent indicator visible on all views showing current sync state and any conflicts/errors.

## Out of Scope

- **Photos/Images**: No bottle label photos or wine images. Text-only data to keep storage minimal and syncing fast.

- **Wine Recommendations**: No AI/algorithmic wine suggestions or recommendations based on preferences.

- **Social Features**: No sharing, no public profiles, no social network integration. Strictly personal use.

- **Multi-User Support**: Single-user application. No collaboration, no shared cellars, no permissions system.

- **Price Tracking/Market Value**: No integration with wine market APIs or automatic price updates. Only track purchase price.

- **Multiple Cellars**: Single cellar only. No support for tracking wines across multiple physical locations.

- **Advanced Analytics**: Keep statistics simple (total bottles, breakdown by type/region). No complex charts or trend analysis.

- **Barcode Scanning**: Manual entry only, no camera/barcode integration for adding bottles.

- **External Integrations**: No integration with wine databases (Vivino, CellarTracker), wine shops, or other third-party services.
