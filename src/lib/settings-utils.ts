/**
 * Validates a GitHub repository string in "owner/repo" format.
 * Owner and repo must contain only alphanumeric characters, hyphens, underscores, or dots.
 */
export function validateRepo(repo: string): string | null {
  const trimmed = repo.trim();
  if (!trimmed) return 'Repository is required.';

  const pattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
  if (!pattern.test(trimmed)) {
    return 'Repository must be in "owner/repo" format (e.g., "my-user/my-repo").';
  }

  return null;
}

/** Validates that a Personal Access Token is non-empty. */
export function validatePat(pat: string): string | null {
  if (!pat.trim()) return 'Personal Access Token is required.';
  return null;
}
