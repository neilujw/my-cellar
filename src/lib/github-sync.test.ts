import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  pushToGitHub,
  pullFromGitHub,
  generateCommitMessage,
  checkForConflict,
  createConflictPR,
  resolveConflictWithRemote,
} from './github-sync';
import { WineType, HistoryAction } from './types';
import type { Bottle } from './types';
import type { OctokitClient } from './github-client';
import { serializeBottle } from './bottle-serializer';

/** Encodes a UTF-8 string to base64, matching GitHub blob API encoding. */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}

function makeBottle(overrides: Partial<Bottle> = {}): Bottle {
  return {
    id: 'abc-123',
    name: 'Château Margaux',
    vintage: 2015,
    type: WineType.Red,
    country: 'France',
    region: 'Bordeaux',
    grapeVariety: ['Cabernet Sauvignon', 'Merlot'],
    history: [
      {
        date: '2024-01-15',
        action: HistoryAction.Added,
        quantity: 3,
        price: { amount: 45.0, currency: 'EUR' },
        notes: 'Bought at local wine shop',
      },
    ],
    ...overrides,
  };
}

/** Creates a mock Octokit client with configurable responses. */
function createMockClient(overrides: Record<string, unknown> = {}): OctokitClient {
  const defaultTree = { tree: [], sha: 'tree-sha-1' };

  return {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({
          data: { default_branch: 'main', ...(overrides.repoData as object) },
        }),
      },
      git: {
        getRef: overrides.getRefError
          ? vi.fn().mockRejectedValue(overrides.getRefError)
          : vi.fn().mockResolvedValue({
              data: { object: { sha: 'commit-sha-1' } },
            }),
        getCommit: vi.fn().mockResolvedValue({
          data: { tree: { sha: 'tree-sha-1' } },
        }),
        getTree: vi.fn().mockResolvedValue({
          data: overrides.treeData ?? defaultTree,
        }),
        getBlob: overrides.getBlob ?? vi.fn(),
        createTree: vi.fn().mockResolvedValue({
          data: { sha: 'new-tree-sha' },
        }),
        createCommit: vi.fn().mockResolvedValue({
          data: { sha: 'new-commit-sha' },
        }),
        updateRef: vi.fn().mockResolvedValue({}),
        createRef: vi.fn().mockResolvedValue({}),
      },
      pulls: {
        create: vi.fn().mockResolvedValue({
          data: { html_url: 'https://github.com/owner/repo/pull/1' },
        }),
      },
    },
  } as unknown as OctokitClient;
}

describe('generateCommitMessage', () => {
  it('should generate message for additions only', () => {
    expect(generateCommitMessage(['Margaux 2015'], [], [])).toBe('Add Margaux 2015');
  });

  it('should generate message for modifications only', () => {
    expect(generateCommitMessage([], ['Puligny 2020'], [])).toBe('Update Puligny 2020');
  });

  it('should generate message for deletions only', () => {
    expect(generateCommitMessage([], [], ['Old Wine 2010'])).toBe('Remove Old Wine 2010');
  });

  it('should combine multiple change types', () => {
    const msg = generateCommitMessage(['Wine A'], ['Wine B'], ['Wine C']);
    expect(msg).toBe('Add Wine A, Update Wine B, Remove Wine C');
  });

  it('should truncate long lists', () => {
    const msg = generateCommitMessage(['A', 'B', 'C', 'D'], [], []);
    expect(msg).toBe('Add A, B and 2 more');
  });

  it('should list up to 3 names without truncation', () => {
    const msg = generateCommitMessage(['A', 'B', 'C'], [], []);
    expect(msg).toBe('Add A, B, C');
  });
});

describe('pushToGitHub', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a commit with added bottles', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    expect(result.message).toContain('1 change');
    expect(client.rest.git.createTree).toHaveBeenCalled();
    expect(client.rest.git.createCommit).toHaveBeenCalled();
    expect(client.rest.git.updateRef).toHaveBeenCalled();
  });

  it('should return no-changes result when local matches remote', async () => {
    const bottle = makeBottle();
    const content = serializeBottle(bottle);
    // Compute the expected git blob SHA
    const blobHeader = `blob ${new TextEncoder().encode(content).length}\0${content}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(blobHeader),
    );
    const blobSha = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: blobSha,
          },
        ],
        sha: 'tree-sha-1',
      },
    });

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    expect(result.message).toBe('No changes to push.');
    expect(client.rest.git.createTree).not.toHaveBeenCalled();
  });

  it('should return commitSha when there are no changes to push', async () => {
    const bottle = makeBottle();
    const content = serializeBottle(bottle);
    const blobHeader = `blob ${new TextEncoder().encode(content).length}\0${content}`;
    const hashBuffer = await crypto.subtle.digest(
      'SHA-1',
      new TextEncoder().encode(blobHeader),
    );
    const blobSha = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: blobSha,
          },
        ],
        sha: 'tree-sha-1',
      },
    });

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.commitSha).toBe('commit-sha-1');
    }
  });

  it('should handle first-time push to empty repository', async () => {
    const client = createMockClient({
      getRefError: new Error('Not Found'),
    });
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    expect(client.rest.git.createRef).toHaveBeenCalled();
    expect(client.rest.git.updateRef).not.toHaveBeenCalled();
  });

  it('should delete files for bottles no longer present locally', async () => {
    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-old-id.json',
            mode: '100644',
            type: 'blob',
            sha: 'old-sha',
          },
        ],
        sha: 'tree-sha-1',
      },
    });

    const result = await pushToGitHub(client, 'owner/repo', []);

    expect(result.status).toBe('success');
    const createTreeCall = (client.rest.git.createTree as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const deleteEntry = createTreeCall.tree.find(
      (e: { path: string }) => e.path === 'wines/red/wine-old-id.json',
    );
    expect(deleteEntry.sha).toBeNull();
  });

  it('should preserve non-wine files in the repository', async () => {
    const client = createMockClient({
      treeData: {
        tree: [
          { path: 'README.md', mode: '100644', type: 'blob', sha: 'readme-sha' },
          { path: 'wines/red/wine-old.json', mode: '100644', type: 'blob', sha: 'old-sha' },
        ],
        sha: 'tree-sha-1',
      },
    });

    await pushToGitHub(client, 'owner/repo', []);

    // base_tree is used to preserve non-wine files
    const createTreeCall = (client.rest.git.createTree as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createTreeCall.base_tree).toBe('tree-sha-1');
  });

  it('should return error result on API failure', async () => {
    const client = createMockClient();
    (client.rest.repos.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const result = await pushToGitHub(client, 'owner/repo', [makeBottle()]);

    expect(result.status).toBe('error');
    expect(result.message).toContain('Network error');
  });
});

describe('checkForConflict', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect no conflict when lastSyncedSha is null', async () => {
    const client = createMockClient();

    const result = await checkForConflict(client, 'owner/repo', null);

    expect(result.conflict).toBe(false);
    expect(client.rest.repos.get).not.toHaveBeenCalled();
  });

  it('should detect no conflict when remote SHA matches', async () => {
    const client = createMockClient();

    const result = await checkForConflict(client, 'owner/repo', 'commit-sha-1');

    expect(result.conflict).toBe(false);
  });

  it('should detect conflict when remote SHA differs', async () => {
    const client = createMockClient();

    const result = await checkForConflict(client, 'owner/repo', 'old-sha');

    expect(result.conflict).toBe(true);
    if (result.conflict) {
      expect(result.remoteSha).toBe('commit-sha-1');
    }
  });

  it('should detect no conflict when repo is empty', async () => {
    const client = createMockClient({ getRefError: new Error('Not Found') });

    const result = await checkForConflict(client, 'owner/repo', 'some-sha');

    expect(result.conflict).toBe(false);
  });
});

describe('pushToGitHub with conflict detection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return conflict status when remote has diverged', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle], 'old-sha');

    expect(result.status).toBe('conflict');
    expect(result.message).toContain('Remote repository has changed');
  });

  it('should proceed normally when SHA matches', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle], 'commit-sha-1');

    expect(result.status).toBe('success');
  });

  it('should proceed normally when lastSyncedSha is not provided', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
  });

  it('should return commitSha on successful push', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await pushToGitHub(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.commitSha).toBe('new-commit-sha');
    }
  });
});

describe('pullFromGitHub', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return bottles from GitHub', async () => {
    const bottle = makeBottle();
    const content = serializeBottle(bottle);
    const encoded = utf8ToBase64(content);

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: 'blob-sha-1',
          },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockResolvedValue({
        data: { content: encoded, encoding: 'base64' },
      }),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    expect(result.bottles).toHaveLength(1);
    expect(result.bottles![0]).toEqual(bottle);
    expect(result.message).toBe('Pulled 1 bottle from GitHub.');
  });

  it('should handle empty repository gracefully', async () => {
    const client = createMockClient({
      getRefError: new Error('Not Found'),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    expect(result.bottles).toEqual([]);
    expect(result.message).toBe('Pulled 0 bottles from GitHub.');
  });

  it('should handle repository with no wine files', async () => {
    const client = createMockClient({
      treeData: {
        tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: 'readme-sha' }],
        sha: 'tree-sha-1',
      },
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    expect(result.bottles).toEqual([]);
  });

  it('should return commitSha even when repository has no wine files', async () => {
    const client = createMockClient({
      treeData: {
        tree: [{ path: 'README.md', mode: '100644', type: 'blob', sha: 'readme-sha' }],
        sha: 'tree-sha-1',
      },
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.commitSha).toBe('commit-sha-1');
    }
  });

  it('should report errors for invalid wine files while keeping valid ones', async () => {
    const validBottle = makeBottle();
    const validContent = utf8ToBase64(serializeBottle(validBottle));

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: 'valid-sha',
          },
          {
            path: 'wines/red/wine-invalid.json',
            mode: '100644',
            type: 'blob',
            sha: 'invalid-sha',
          },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockImplementation(({ file_sha }: { file_sha: string }) => {
        if (file_sha === 'valid-sha') {
          return Promise.resolve({ data: { content: validContent, encoding: 'base64' } });
        }
        return Promise.resolve({ data: { content: utf8ToBase64('not json'), encoding: 'base64' } });
      }),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('error');
    expect(result.bottles).toHaveLength(1);
    expect(result.message).toContain('1 file skipped');
    expect(result.message).toContain('wines/red/wine-invalid.json');
  });

  it('should return error when all files fail to parse', async () => {
    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-bad.json',
            mode: '100644',
            type: 'blob',
            sha: 'bad-sha',
          },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockResolvedValue({
        data: { content: utf8ToBase64('not json'), encoding: 'base64' },
      }),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('error');
    expect(result.bottles).toBeUndefined();
    expect(result.message).toContain('all 1 file failed to parse');
    expect(result.message).toContain('wines/red/wine-bad.json: Invalid JSON');
  });

  it('should return commitSha on successful pull', async () => {
    const bottle = makeBottle();
    const content = serializeBottle(bottle);
    const encoded = utf8ToBase64(content);

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: 'blob-sha-1',
          },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockResolvedValue({
        data: { content: encoded, encoding: 'base64' },
      }),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.commitSha).toBe('commit-sha-1');
    }
  });

  it('should return error result on API failure', async () => {
    const client = createMockClient();
    (client.rest.repos.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('API rate limit'),
    );

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('error');
    expect(result.message).toContain('API rate limit');
  });

  it('should pull multiple bottles', async () => {
    const bottle1 = makeBottle({ id: 'id-1', name: 'Wine A' });
    const bottle2 = makeBottle({ id: 'id-2', name: 'Wine B', type: WineType.White });

    const client = createMockClient({
      treeData: {
        tree: [
          { path: 'wines/red/wine-id-1.json', mode: '100644', type: 'blob', sha: 'sha-1' },
          { path: 'wines/white/wine-id-2.json', mode: '100644', type: 'blob', sha: 'sha-2' },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockImplementation(({ file_sha }: { file_sha: string }) => {
        const content = file_sha === 'sha-1' ? serializeBottle(bottle1) : serializeBottle(bottle2);
        return Promise.resolve({ data: { content: utf8ToBase64(content), encoding: 'base64' } });
      }),
    });

    const result = await pullFromGitHub(client, 'owner/repo');

    expect(result.status).toBe('success');
    expect(result.bottles).toHaveLength(2);
    expect(result.message).toBe('Pulled 2 bottles from GitHub.');
  });
});

describe('createConflictPR', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a branch and PR with local bottles', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    const result = await createConflictPR(client, 'owner/repo', [bottle]);

    expect(result.status).toBe('success');
    expect(result.message).toContain('Pull request created:');
    expect(result.message).toContain('https://github.com/owner/repo/pull/1');
  });

  it('should create branch with conflict/ prefix and timestamp format', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    await createConflictPR(client, 'owner/repo', [bottle]);

    const createRefCall = (client.rest.git.createRef as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createRefCall.ref).toMatch(/^refs\/heads\/conflict\/\d{4}-\d{2}-\d{2}-\d{6}$/);
  });

  it('should create PR with descriptive title and body', async () => {
    const client = createMockClient();
    const bottle = makeBottle();

    await createConflictPR(client, 'owner/repo', [bottle]);

    const prCall = (client.rest.pulls.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(prCall.title).toMatch(/^Resolve sync conflict - /);
    expect(prCall.body).toContain('1 bottle');
    expect(prCall.body).toContain('Sync Conflict');
    expect(prCall.base).toBe('main');
    expect(prCall.head).toMatch(/^conflict\//);
  });

  it('should return error on API failure', async () => {
    const client = createMockClient();
    (client.rest.repos.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const result = await createConflictPR(client, 'owner/repo', [makeBottle()]);

    expect(result.status).toBe('error');
    expect(result.message).toContain('PR creation failed');
  });

  it('should handle multiple bottles in PR body', async () => {
    const client = createMockClient();
    const bottles = [
      makeBottle({ id: 'id-1', name: 'Wine A' }),
      makeBottle({ id: 'id-2', name: 'Wine B' }),
    ];

    await createConflictPR(client, 'owner/repo', bottles);

    const prCall = (client.rest.pulls.create as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(prCall.body).toContain('2 bottles');
  });
});

describe('resolveConflictWithRemote', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should pull remote data and return bottles with commitSha', async () => {
    const bottle = makeBottle();
    const content = serializeBottle(bottle);
    const encoded = utf8ToBase64(content);

    const client = createMockClient({
      treeData: {
        tree: [
          {
            path: 'wines/red/wine-abc-123.json',
            mode: '100644',
            type: 'blob',
            sha: 'blob-sha-1',
          },
        ],
        sha: 'tree-sha-1',
      },
      getBlob: vi.fn().mockResolvedValue({
        data: { content: encoded, encoding: 'base64' },
      }),
    });

    const result = await resolveConflictWithRemote(client, 'owner/repo');

    expect(result.status).toBe('success');
    expect(result.bottles).toHaveLength(1);
    if (result.status === 'success') {
      expect(result.commitSha).toBe('commit-sha-1');
    }
  });

  it('should return error when pull fails', async () => {
    const client = createMockClient();
    (client.rest.repos.get as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    );

    const result = await resolveConflictWithRemote(client, 'owner/repo');

    expect(result.status).toBe('error');
    expect(result.message).toContain('Pull failed');
  });
});
