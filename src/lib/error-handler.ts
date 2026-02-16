import { toastError } from './toast.svelte';

/**
 * Registers a global handler for unhandled promise rejections.
 * Surfaces error messages via the toast notification system.
 */
export function setupGlobalErrorHandler(): void {
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const message =
      event.reason instanceof Error ? event.reason.message : 'An unexpected error occurred';
    toastError(message);
    event.preventDefault();
  });
}
