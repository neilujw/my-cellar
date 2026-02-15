import { describe, it, expect, vi } from 'vitest';
import { createGitHubClient, testConnection } from './github-client';
import { RequestError } from 'octokit';

/** Creates a mock Octokit client with a configurable repos.get response. */
function createMockClient(
  getResponse?: () => Promise<unknown>,
): ReturnType<typeof createGitHubClient> {
  return {
    rest: {
      repos: {
        get: getResponse ?? vi.fn(),
      },
    },
  } as unknown as ReturnType<typeof createGitHubClient>;
}

/** Creates a RequestError matching Octokit's error shape. */
function createRequestError(status: number, message: string): RequestError {
  return new RequestError(message, status, {
    request: { method: 'GET', url: '/repos/owner/repo', headers: {} },
  });
}

describe('github-client', () => {
  describe('createGitHubClient', () => {
    it('should create an Octokit instance', () => {
      const client = createGitHubClient('ghp_testtoken');

      expect(client).toBeDefined();
      expect(client.rest).toBeDefined();
    });
  });

  describe('testConnection', () => {
    it('should return connected when repo is accessible with push permissions', async () => {
      const client = createMockClient(() =>
        Promise.resolve({ data: { permissions: { push: true } } }),
      );

      const result = await testConnection(client, 'owner/repo');

      expect(result).toEqual({ status: 'connected' });
    });

    it('should return error when PAT lacks write access', async () => {
      const client = createMockClient(() =>
        Promise.resolve({ data: { permissions: { push: false, pull: true } } }),
      );

      const result = await testConnection(client, 'owner/repo');

      expect(result).toEqual({
        status: 'error',
        message: 'Insufficient permissions: PAT does not have write access to this repository.',
      });
    });

    it('should return error when PAT is invalid (401)', async () => {
      const client = createMockClient(() =>
        Promise.reject(createRequestError(401, 'Bad credentials')),
      );

      const result = await testConnection(client, 'owner/repo');

      expect(result).toEqual({
        status: 'error',
        message: 'Invalid Personal Access Token.',
      });
    });

    it('should return error when repo is not found (404)', async () => {
      const client = createMockClient(() =>
        Promise.reject(createRequestError(404, 'Not Found')),
      );

      const result = await testConnection(client, 'owner/repo');

      expect(result).toEqual({
        status: 'error',
        message:
          'Repository not found. Check the owner/repo format and ensure the repo exists.',
      });
    });

    it('should return generic error for unexpected failures', async () => {
      const client = createMockClient(() =>
        Promise.reject(new Error('Network error')),
      );

      const result = await testConnection(client, 'owner/repo');

      expect(result).toEqual({
        status: 'error',
        message: 'Failed to connect to GitHub. Please try again.',
      });
    });

    it('should parse owner and repo from owner/repo format', async () => {
      const getMock = vi.fn().mockResolvedValue({
        data: { permissions: { push: true } },
      });
      const client = createMockClient(getMock);

      await testConnection(client, 'my-org/my-repo');

      expect(getMock).toHaveBeenCalledWith({ owner: 'my-org', repo: 'my-repo' });
    });
  });
});
