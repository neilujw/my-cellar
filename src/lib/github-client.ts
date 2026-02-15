import { Octokit, RequestError } from 'octokit';
import type { ConnectionStatus } from './types';

/** Octokit instance type, re-exported for consumers that need to pass the client around. */
export type OctokitClient = InstanceType<typeof Octokit>;

/** Creates an authenticated Octokit client using a Personal Access Token. */
export function createGitHubClient(pat: string): OctokitClient {
  return new Octokit({ auth: pat });
}

/**
 * Tests the connection to a GitHub repository by verifying:
 * 1. The PAT is valid (authenticated request succeeds)
 * 2. The repository exists and is accessible
 * 3. The PAT has write (push) permission to the repository
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @returns Connection status indicating success or a typed error
 */
export async function testConnection(
  client: OctokitClient,
  repo: string,
): Promise<ConnectionStatus> {
  const [owner, repoName] = repo.split('/');

  try {
    const { data } = await client.rest.repos.get({ owner, repo: repoName });

    if (!data.permissions?.push) {
      return {
        status: 'error',
        message: 'Insufficient permissions: PAT does not have write access to this repository.',
      };
    }

    return { status: 'connected' };
  } catch (error: unknown) {
    if (error instanceof RequestError) {
      if (error.status === 401) {
        return { status: 'error', message: 'Invalid Personal Access Token.' };
      }
      if (error.status === 404) {
        return {
          status: 'error',
          message: 'Repository not found. Check the owner/repo format and ensure the repo exists.',
        };
      }
    }
    return { status: 'error', message: 'Failed to connect to GitHub. Please try again.' };
  }
}
