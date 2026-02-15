/** Maximum number of automatic retry attempts before giving up. */
export const SYNC_MAX_RETRIES = 10;

/** Maximum delay in milliseconds between retry attempts (cap for exponential backoff). */
export const SYNC_MAX_DELAY_MS = 60_000;

/** Base delay in milliseconds for the first retry attempt. */
export const SYNC_BASE_DELAY_MS = 1_000;
