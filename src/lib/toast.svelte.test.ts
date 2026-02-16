import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  addToast,
  dismissToast,
  getToasts,
  toastSuccess,
  toastError,
  toastInfo,
  clearAllToasts,
  ToastVariant,
  DEFAULT_TOAST_DURATION,
} from './toast.svelte';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearAllToasts();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('should add a toast to the list', () => {
      addToast('Test message', ToastVariant.Success);

      const toasts = getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Test message');
      expect(toasts[0].variant).toBe(ToastVariant.Success);
    });

    it('should assign unique ids to each toast', () => {
      const id1 = addToast('First', ToastVariant.Info);
      const id2 = addToast('Second', ToastVariant.Info);

      expect(id1).not.toBe(id2);
      expect(getToasts()).toHaveLength(2);
    });

    it('should use default duration when not specified', () => {
      addToast('Test', ToastVariant.Success);

      expect(getToasts()).toHaveLength(1);
      vi.advanceTimersByTime(DEFAULT_TOAST_DURATION);
      expect(getToasts()).toHaveLength(0);
    });

    it('should auto-dismiss after custom duration', () => {
      addToast('Short toast', ToastVariant.Info, 1000);

      expect(getToasts()).toHaveLength(1);
      vi.advanceTimersByTime(999);
      expect(getToasts()).toHaveLength(1);
      vi.advanceTimersByTime(1);
      expect(getToasts()).toHaveLength(0);
    });
  });

  describe('dismissToast', () => {
    it('should remove a specific toast by id', () => {
      const id1 = addToast('First', ToastVariant.Info);
      addToast('Second', ToastVariant.Info);

      dismissToast(id1);

      const toasts = getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Second');
    });

    it('should not throw when dismissing non-existent id', () => {
      expect(() => dismissToast(999)).not.toThrow();
    });
  });

  describe('convenience functions', () => {
    it('should create a success toast', () => {
      toastSuccess('Saved');

      expect(getToasts()[0].variant).toBe(ToastVariant.Success);
      expect(getToasts()[0].message).toBe('Saved');
    });

    it('should create an error toast', () => {
      toastError('Failed');

      expect(getToasts()[0].variant).toBe(ToastVariant.Error);
      expect(getToasts()[0].message).toBe('Failed');
    });

    it('should create an info toast', () => {
      toastInfo('Note');

      expect(getToasts()[0].variant).toBe(ToastVariant.Info);
      expect(getToasts()[0].message).toBe('Note');
    });

    it('should accept custom duration in convenience functions', () => {
      toastSuccess('Quick', 500);

      vi.advanceTimersByTime(500);
      expect(getToasts()).toHaveLength(0);
    });
  });

  describe('clearAllToasts', () => {
    it('should remove all toasts and cancel timers', () => {
      addToast('First', ToastVariant.Info);
      addToast('Second', ToastVariant.Error);

      clearAllToasts();

      expect(getToasts()).toHaveLength(0);
    });
  });
});
