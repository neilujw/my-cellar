import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { clearAllToasts, getToasts } from './toast.svelte';

describe('registerServiceWorker', () => {
  beforeEach(() => {
    clearAllToasts();
  });

  afterEach(() => {
    clearAllToasts();
    vi.restoreAllMocks();
  });

  it('should not throw when serviceWorker is not supported', async () => {
    // jsdom doesn't have navigator.serviceWorker by default
    const originalSW = navigator.serviceWorker;
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('./sw-registration');
    await expect(registerServiceWorker()).resolves.not.toThrow();

    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalSW,
      writable: true,
      configurable: true,
    });
  });

  it('should call navigator.serviceWorker.register when supported', async () => {
    const mockRegistration = {
      addEventListener: vi.fn(),
    };
    const mockRegister = vi.fn().mockResolvedValue(mockRegistration);

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister, controller: null },
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('./sw-registration');
    await registerServiceWorker();

    expect(mockRegister).toHaveBeenCalledWith('/my-cellar/sw.js');
    expect(mockRegistration.addEventListener).toHaveBeenCalledWith(
      'updatefound',
      expect.any(Function),
    );

    // Restore
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  it('should handle registration errors gracefully', async () => {
    const mockRegister = vi.fn().mockRejectedValue(new Error('SW registration failed'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register: mockRegister },
      writable: true,
      configurable: true,
    });

    const { registerServiceWorker } = await import('./sw-registration');
    await expect(registerServiceWorker()).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('SW registration failed'),
    );

    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });
});
