import { describe, it, expect, beforeEach } from 'vitest';
import { getCurrentRoute, navigate } from './router.svelte';

describe('router', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });

  describe('getCurrentRoute', () => {
    it('should return "/" when hash is empty', () => {
      expect(getCurrentRoute()).toBe('/');
    });

    it('should return the correct route when hash changes', () => {
      window.location.hash = '#/settings';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(getCurrentRoute()).toBe('/settings');
    });

    it('should return "/" for invalid routes', () => {
      window.location.hash = '#/nonexistent';
      window.dispatchEvent(new HashChangeEvent('hashchange'));

      expect(getCurrentRoute()).toBe('/');
    });
  });

  describe('navigate', () => {
    it('should update the URL hash when navigating', () => {
      navigate('/add');

      expect(window.location.hash).toBe('#/add');
    });

    it('should navigate to each supported route', () => {
      const routes = ['/', '/add', '/search', '/settings'] as const;

      for (const route of routes) {
        navigate(route);
        window.dispatchEvent(new HashChangeEvent('hashchange'));

        expect(getCurrentRoute()).toBe(route);
      }
    });
  });
});
