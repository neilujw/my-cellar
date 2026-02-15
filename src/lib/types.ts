/** Wine type classification. */
export enum WineType {
  Red = 'red',
  White = 'white',
  Rose = 'rosé',
  Sparkling = 'sparkling',
}

/** Action performed on a bottle's inventory. */
export enum HistoryAction {
  Added = 'added',
  Consumed = 'consumed',
  Removed = 'removed',
}

/** ISO 4217 currency code (e.g. "EUR", "USD"). Defaults to "EUR". */
export type Currency = string;

/** Default currency used when none is specified. */
export const DEFAULT_CURRENCY: Currency = 'EUR';

/** Monetary amount with currency. */
export interface Price {
  readonly amount: number;
  readonly currency: Currency;
}

/** A single entry in a bottle's history log. */
export interface HistoryEntry {
  readonly date: string;
  readonly action: HistoryAction;
  readonly quantity: number;
  readonly price?: Price;
  readonly notes?: string;
}

/** GitHub repository and PAT credentials for data sync. */
export interface GitHubSettings {
  readonly repo: string;
  readonly pat: string;
}

/** Result of testing a GitHub connection. */
export type ConnectionStatus =
  | { readonly status: 'not-configured' }
  | { readonly status: 'connected' }
  | { readonly status: 'error'; readonly message: string };

/** Current sync state displayed in the header. */
export type SyncStatus = 'not-configured' | 'connected' | 'offline' | 'syncing';

/** Result of a sync operation (push or pull). */
export type SyncResult =
  | { readonly status: 'success'; readonly message: string }
  | { readonly status: 'error'; readonly message: string };

/**
 * A wine bottle in the cellar.
 *
 * Current quantity is derived from the history array
 * (sum of added minus consumed and removed).
 */
export interface Bottle {
  readonly id: string;
  readonly name: string;
  readonly vintage: number;
  readonly type: WineType;
  readonly country: string;
  readonly region: string;
  readonly grapeVariety: readonly string[];
  readonly location?: string;
  readonly rating?: number;
  readonly notes?: string;
  readonly history: readonly HistoryEntry[];
}
