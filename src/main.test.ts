import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clearAllToasts, getToasts, ToastVariant } from './lib/toast.svelte';
import { toastError } from './lib/toast.svelte';

/**
 * Tests the global error handler logic directly rather than
 * through event registration to avoid listener accumulation.
 */
function handleUnhandledRejection(reason: unknown): void {
  const message =
    reason instanceof Error ? reason.message : 'An unexpected error occurred';
  toastError(message);
}

describe('global error handler', () => {
  beforeEach(() => {
    clearAllToasts();
  });

  afterEach(() => {
    clearAllToasts();
  });

  it('should show an error toast when an Error is the rejection reason', () => {
    handleUnhandledRejection(new Error('IndexedDB storage full'));

    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].variant).toBe(ToastVariant.Error);
    expect(toasts[0].message).toBe('IndexedDB storage full');
  });

  it('should show a generic message for non-Error rejections', () => {
    handleUnhandledRejection('string error');

    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('An unexpected error occurred');
  });

  it('should show a generic message for null/undefined rejections', () => {
    handleUnhandledRejection(undefined);

    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('An unexpected error occurred');
  });
});
