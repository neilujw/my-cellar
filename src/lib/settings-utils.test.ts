import { describe, it, expect } from 'vitest';
import { validateRepo, validatePat } from './settings-utils';

describe('settings-utils', () => {
  describe('validateRepo', () => {
    it('should return null for valid owner/repo format', () => {
      expect(validateRepo('owner/repo')).toBeNull();
    });

    it('should accept hyphens, underscores, and dots', () => {
      expect(validateRepo('my-org/my_repo.v2')).toBeNull();
    });

    it('should return error for empty string', () => {
      expect(validateRepo('')).toBe('Repository is required.');
    });

    it('should return error for whitespace-only string', () => {
      expect(validateRepo('   ')).toBe('Repository is required.');
    });

    it('should return error for missing slash', () => {
      expect(validateRepo('ownerrepo')).toMatch(/owner\/repo/);
    });

    it('should return error for missing owner', () => {
      expect(validateRepo('/repo')).toMatch(/owner\/repo/);
    });

    it('should return error for missing repo name', () => {
      expect(validateRepo('owner/')).toMatch(/owner\/repo/);
    });

    it('should return error for spaces in name', () => {
      expect(validateRepo('owner/my repo')).toMatch(/owner\/repo/);
    });

    it('should return error for multiple slashes', () => {
      expect(validateRepo('owner/repo/extra')).toMatch(/owner\/repo/);
    });

    it('should trim whitespace before validating', () => {
      expect(validateRepo('  owner/repo  ')).toBeNull();
    });
  });

  describe('validatePat', () => {
    it('should return null for a non-empty PAT', () => {
      expect(validatePat('ghp_abc123')).toBeNull();
    });

    it('should return error for empty string', () => {
      expect(validatePat('')).toBe('Personal Access Token is required.');
    });

    it('should return error for whitespace-only string', () => {
      expect(validatePat('   ')).toBe('Personal Access Token is required.');
    });
  });
});
