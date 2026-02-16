import { toastInfo } from './toast.svelte';

/**
 * Registers the Service Worker and handles updates.
 * Notifies the user via toast when a new version is available.
 */
export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/my-cellar/sw.js');

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        // Only notify when a new version is ready and there's already a controller
        if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
          toastInfo('New version available — refresh to update');
        }
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Service Worker registration failed: ${message}`);
  }
}
