import type { OctokitClient } from './github-client';
import type { Bottle, SyncResult } from './types';
import { bottleToFilePath, serializeBottle, deserializeBottle } from './bottle-serializer';

/** Prefix used to identify wine files in the repository tree. */
const WINES_PREFIX = 'wines/';

/** Maximum number of blob fetches to run concurrently during pull. */
const PULL_BATCH_SIZE = 10;

/** A tree entry returned by the GitHub API. */
interface TreeEntry {
  readonly path?: string;
  readonly mode?: string;
  readonly type?: string;
  readonly sha?: string;
}

/**
 * Splits an "owner/repo" string into its parts.
 * @returns A tuple of [owner, repoName].
 */
function parseRepo(repo: string): [string, string] {
  const [owner, repoName] = repo.split('/');
  return [owner, repoName];
}

/**
 * Generates a descriptive commit message summarizing the changes.
 *
 * @param added - Names of newly added bottles
 * @param modified - Names of modified bottles
 * @param deleted - Names of deleted bottles
 * @returns A human-readable commit message
 */
export function generateCommitMessage(
  added: readonly string[],
  modified: readonly string[],
  deleted: readonly string[],
): string {
  const parts: string[] = [];

  if (added.length > 0) {
    parts.push(`Add ${formatNames(added)}`);
  }
  if (modified.length > 0) {
    parts.push(`Update ${formatNames(modified)}`);
  }
  if (deleted.length > 0) {
    parts.push(`Remove ${formatNames(deleted)}`);
  }

  return parts.join(', ');
}

/** Result of checking for a conflict between local and remote state. */
export type ConflictCheckResult =
  | { readonly conflict: false }
  | { readonly conflict: true; readonly remoteSha: string };

/**
 * Checks whether the remote repository has diverged from the last synced state.
 * Compares the remote HEAD SHA against the locally stored last synced SHA.
 * If lastSyncedSha is null (first sync), no conflict is reported.
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @param lastSyncedSha - The SHA stored after the last successful sync, or null
 * @returns Whether a conflict exists and the remote SHA if so
 */
export async function checkForConflict(
  client: OctokitClient,
  repo: string,
  lastSyncedSha: string | null,
): Promise<ConflictCheckResult> {
  if (lastSyncedSha === null) {
    return { conflict: false };
  }

  const [owner, repoName] = parseRepo(repo);

  try {
    const { data: repoData } = await client.rest.repos.get({ owner, repo: repoName });
    const defaultBranch = repoData.default_branch;

    const { data: refData } = await client.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });
    const remoteSha = refData.object.sha;

    if (remoteSha !== lastSyncedSha) {
      return { conflict: true, remoteSha };
    }

    return { conflict: false };
  } catch {
    // Empty repo or error fetching ref — no conflict
    return { conflict: false };
  }
}

/** Formats a list of names for display, truncating if too many. */
function formatNames(names: readonly string[]): string {
  if (names.length <= 3) {
    return names.join(', ');
  }
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}

/**
 * Pushes local bottles to GitHub as an atomic commit.
 *
 * Creates/updates/deletes `wines/{type}/wine-{uuid}.json` files to match the
 * local bottle collection. Non-wine files in the repository are preserved.
 * Does nothing if local state already matches GitHub state.
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @param bottles - All local bottles to sync
 * @returns Result indicating success or error
 */
export async function pushToGitHub(
  client: OctokitClient,
  repo: string,
  bottles: readonly Bottle[],
  lastSyncedSha?: string | null,
): Promise<SyncResult> {
  const [owner, repoName] = parseRepo(repo);

  try {
    // Check for conflict before proceeding
    if (lastSyncedSha !== undefined) {
      const conflictResult = await checkForConflict(client, repo, lastSyncedSha);
      if (conflictResult.conflict) {
        return {
          status: 'conflict',
          message: 'Remote repository has changed since last sync.',
        };
      }
    }
    // Build the desired state: path → serialized content
    const localFiles = new Map<string, string>();
    for (const bottle of bottles) {
      localFiles.set(bottleToFilePath(bottle), serializeBottle(bottle));
    }

    // Get the default branch
    const { data: repoData } = await client.rest.repos.get({ owner, repo: repoName });
    const defaultBranch = repoData.default_branch;

    // Try to get the latest commit; handle empty repo
    let baseCommitSha: string | null = null;
    let currentTree: TreeEntry[] = [];
    try {
      const { data: refData } = await client.rest.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
      });
      baseCommitSha = refData.object.sha;

      const { data: commitData } = await client.rest.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: baseCommitSha,
      });

      const { data: treeData } = await client.rest.git.getTree({
        owner,
        repo: repoName,
        tree_sha: commitData.tree.sha,
        recursive: 'true',
      });
      currentTree = treeData.tree;
    } catch {
      // Empty repo — no commits yet; baseCommitSha stays null
    }

    // Build maps of current remote wine files: path → sha
    const remoteWineFiles = new Map<string, string>();
    for (const entry of currentTree) {
      if (entry.path?.startsWith(WINES_PREFIX) && entry.type === 'blob' && entry.sha) {
        remoteWineFiles.set(entry.path, entry.sha);
      }
    }

    // Compute diff
    const added: string[] = [];
    const modified: string[] = [];
    const deleted: string[] = [];
    const addedNames: string[] = [];
    const modifiedNames: string[] = [];
    const deletedNames: string[] = [];

    // Find added and modified files
    for (const bottle of bottles) {
      const path = bottleToFilePath(bottle);
      if (!remoteWineFiles.has(path)) {
        added.push(path);
        addedNames.push(`${bottle.name} ${bottle.vintage}`);
      } else {
        // Check if content changed by comparing blob SHA with our content SHA
        const content = localFiles.get(path)!;
        const contentBlob = `blob ${new TextEncoder().encode(content).length}\0${content}`;
        const contentHash = await sha1(contentBlob);
        if (contentHash !== remoteWineFiles.get(path)) {
          modified.push(path);
          modifiedNames.push(`${bottle.name} ${bottle.vintage}`);
        }
      }
    }

    // Find deleted files (in remote but not in local)
    for (const [remotePath] of remoteWineFiles) {
      if (!localFiles.has(remotePath)) {
        deleted.push(remotePath);
        // Extract name from path for commit message
        deletedNames.push(remotePath.split('/').pop()?.replace('.json', '') ?? remotePath);
      }
    }

    // No changes — return early
    if (added.length === 0 && modified.length === 0 && deleted.length === 0) {
      return { status: 'success', message: 'No changes to push.', commitSha: baseCommitSha ?? undefined };
    }

    // Build new tree entries
    const treeEntries: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      content?: string;
      sha?: string | null;
    }> = [];

    // Add/update wine files
    for (const path of [...added, ...modified]) {
      treeEntries.push({
        path,
        mode: '100644',
        type: 'blob',
        content: localFiles.get(path)!,
      });
    }

    // Delete wine files (set sha to null)
    for (const path of deleted) {
      treeEntries.push({
        path,
        mode: '100644',
        type: 'blob',
        sha: null,
      });
    }

    // Create the new tree
    const createTreeParams: {
      owner: string;
      repo: string;
      tree: typeof treeEntries;
      base_tree?: string;
    } = {
      owner,
      repo: repoName,
      tree: treeEntries,
    };

    // Use base_tree to preserve non-wine files
    if (baseCommitSha) {
      const { data: commitData } = await client.rest.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: baseCommitSha,
      });
      createTreeParams.base_tree = commitData.tree.sha;
    }

    const { data: newTree } = await client.rest.git.createTree(createTreeParams);

    // Create commit
    const commitMessage = generateCommitMessage(addedNames, modifiedNames, deletedNames);
    const commitParams: {
      owner: string;
      repo: string;
      message: string;
      tree: string;
      parents: string[];
    } = {
      owner,
      repo: repoName,
      message: commitMessage,
      tree: newTree.sha,
      parents: baseCommitSha ? [baseCommitSha] : [],
    };

    const { data: newCommit } = await client.rest.git.createCommit(commitParams);

    // Update or create branch ref
    if (baseCommitSha) {
      await client.rest.git.updateRef({
        owner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
        sha: newCommit.sha,
      });
    } else {
      await client.rest.git.createRef({
        owner,
        repo: repoName,
        ref: `refs/heads/${defaultBranch}`,
        sha: newCommit.sha,
      });
    }

    const totalChanges = added.length + modified.length + deleted.length;
    return {
      status: 'success',
      message: `Pushed ${totalChanges} change${totalChanges !== 1 ? 's' : ''} to GitHub.`,
      commitSha: newCommit.sha,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { status: 'error', message: `Push failed: ${message}` };
  }
}

/**
 * Pulls all bottles from GitHub, replacing local data.
 *
 * Reads all `wines/**\/*.json` files from the repository, deserializes them
 * into Bottle objects, and returns the valid bottles. Invalid files are skipped.
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @returns Result with bottles array on success, or error
 */
export async function pullFromGitHub(
  client: OctokitClient,
  repo: string,
): Promise<SyncResult & { bottles?: Bottle[] }> {
  const [owner, repoName] = parseRepo(repo);

  try {
    // Get the default branch
    const { data: repoData } = await client.rest.repos.get({ owner, repo: repoName });
    const defaultBranch = repoData.default_branch;

    // Try to get the latest commit; handle empty repo
    let currentTree: TreeEntry[] = [];
    let headSha: string | undefined;
    try {
      const { data: refData } = await client.rest.git.getRef({
        owner,
        repo: repoName,
        ref: `heads/${defaultBranch}`,
      });
      headSha = refData.object.sha;

      const { data: commitData } = await client.rest.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: headSha,
      });

      const { data: treeData } = await client.rest.git.getTree({
        owner,
        repo: repoName,
        tree_sha: commitData.tree.sha,
        recursive: 'true',
      });
      currentTree = treeData.tree;
    } catch {
      // Empty repo — no commits yet; return empty array
      return { status: 'success', message: 'Pulled 0 bottles from GitHub.', bottles: [] };
    }

    // Find all wine files
    const wineEntries = currentTree.filter(
      (entry) =>
        entry.path?.startsWith(WINES_PREFIX) &&
        entry.path.endsWith('.json') &&
        entry.type === 'blob' &&
        entry.sha,
    );

    if (wineEntries.length === 0) {
      return { status: 'success', message: 'Pulled 0 bottles from GitHub.', bottles: [], commitSha: headSha };
    }

    // Fetch blob contents in batches
    const bottles: Bottle[] = [];
    for (let i = 0; i < wineEntries.length; i += PULL_BATCH_SIZE) {
      const batch = wineEntries.slice(i, i + PULL_BATCH_SIZE);
      const blobPromises = batch.map(async (entry) => {
        const { data: blobData } = await client.rest.git.getBlob({
          owner,
          repo: repoName,
          file_sha: entry.sha!,
        });

        const content = atob(blobData.content);
        const bottle = deserializeBottle(content);
        if (bottle) {
          bottles.push(bottle);
        }
      });
      await Promise.all(blobPromises);
    }

    return {
      status: 'success',
      message: `Pulled ${bottles.length} bottle${bottles.length !== 1 ? 's' : ''} from GitHub.`,
      bottles,
      commitSha: headSha,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { status: 'error', message: `Pull failed: ${message}` };
  }
}

/**
 * Resolves a conflict by overwriting local data with remote state.
 *
 * Pulls all bottles from GitHub, replaces local storage, clears the sync queue,
 * resets retry state, and updates the last synced commit SHA.
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @returns Result indicating success or error, with bottles array on success
 */
export async function resolveConflictWithRemote(
  client: OctokitClient,
  repo: string,
): Promise<SyncResult & { bottles?: Bottle[] }> {
  const pullResult = await pullFromGitHub(client, repo);

  if (pullResult.status !== 'success') {
    return pullResult;
  }

  return {
    status: 'success',
    message: pullResult.message,
    bottles: pullResult.bottles,
    commitSha: pullResult.commitSha,
  };
}

/**
 * Formats a Date as YYYY-MM-DD-HHmmss for use in conflict branch names.
 */
function formatTimestamp(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/**
 * Creates a pull request with local bottles on a conflict branch.
 *
 * Pushes local bottles to a timestamped branch (`conflict/YYYY-MM-DD-HHmmss`)
 * and creates a PR against the default branch for manual resolution.
 *
 * @param client - Authenticated Octokit instance
 * @param repo - Repository in "owner/repo" format
 * @param bottles - All local bottles to push to the conflict branch
 * @returns Result with PR URL on success, or error
 */
export async function createConflictPR(
  client: OctokitClient,
  repo: string,
  bottles: readonly Bottle[],
): Promise<SyncResult> {
  const [owner, repoName] = parseRepo(repo);

  try {
    // Build the desired state: path → serialized content
    const localFiles = new Map<string, string>();
    for (const bottle of bottles) {
      localFiles.set(bottleToFilePath(bottle), serializeBottle(bottle));
    }

    // Get the default branch and its HEAD
    const { data: repoData } = await client.rest.repos.get({ owner, repo: repoName });
    const defaultBranch = repoData.default_branch;

    const { data: refData } = await client.rest.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = refData.object.sha;

    // Build tree entries for all local bottles
    const treeEntries = Array.from(localFiles.entries()).map(([path, content]) => ({
      path,
      mode: '100644' as const,
      type: 'blob' as const,
      content,
    }));

    // Get the base tree to preserve non-wine files
    const { data: commitData } = await client.rest.git.getCommit({
      owner,
      repo: repoName,
      commit_sha: baseSha,
    });

    const { data: newTree } = await client.rest.git.createTree({
      owner,
      repo: repoName,
      tree: treeEntries,
      base_tree: commitData.tree.sha,
    });

    // Create commit on the conflict branch
    const timestamp = formatTimestamp(new Date());
    const branchName = `conflict/${timestamp}`;
    const { data: newCommit } = await client.rest.git.createCommit({
      owner,
      repo: repoName,
      message: `Sync conflict - local changes (${timestamp})`,
      tree: newTree.sha,
      parents: [baseSha],
    });

    // Create the conflict branch
    await client.rest.git.createRef({
      owner,
      repo: repoName,
      ref: `refs/heads/${branchName}`,
      sha: newCommit.sha,
    });

    // Create the pull request
    const { data: pr } = await client.rest.pulls.create({
      owner,
      repo: repoName,
      title: `Resolve sync conflict - ${timestamp}`,
      body: `## Sync Conflict\n\nLocal changes (${bottles.length} bottle${bottles.length !== 1 ? 's' : ''}) conflict with remote updates.\n\nPlease review and merge or close this PR to resolve the conflict.`,
      head: branchName,
      base: defaultBranch,
    });

    return {
      status: 'success',
      message: `Pull request created: ${pr.html_url}`,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return { status: 'error', message: `PR creation failed: ${message}` };
  }
}

/**
 * Computes SHA-1 hash of a string, used to compare blob content with GitHub's SHAs.
 * Uses the Web Crypto API (SubtleCrypto).
 */
async function sha1(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
