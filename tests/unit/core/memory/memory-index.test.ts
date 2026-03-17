import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildIndex,
  loadIndex,
  saveIndex,
  ensureIndex,
  updateIndexEntry,
  removeIndexEntry,
  validateIndex,
} from '../../../../src/core/memory/memory-index.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

const makeMemoryFile = (id: string, opts: {
  title?: string;
  tier?: string;
  tags?: string[];
} = {}) => {
  const title = opts.title ?? id;
  const tier = opts.tier ?? 'project';
  const tags = opts.tags ?? ['test'];
  return [
    '---',
    `id: ${id}`,
    `title: "${title}"`,
    `type: insight`,
    `tier: ${tier}`,
    `source: manual`,
    `timestamp: ${new Date().toISOString()}`,
    `confidence: 0.8`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    '---',
    '',
    'Content',
    '',
  ].join('\n');
};

const makeMockEntry = (id: string, overrides: Partial<MemoryEntry> = {}): MemoryEntry => ({
  id,
  title: id,
  type: 'insight',
  tier: 'project',
  source: 'manual',
  timestamp: new Date().toISOString(),
  confidence: 0.8,
  tags: ['test'],
  content: 'Test content',
  ...overrides,
});

describe('memory-index', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-index-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('buildIndex', () => {
    it('builds empty index for empty project', async () => {
      const index = await buildIndex(testDir);
      expect(index.version).toBe(1);
      expect(Object.keys(index.entries)).toHaveLength(0);
    });

    it('indexes memories from both tiers', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      const workingDir = join(getAgentPath(testDir), 'working');

      await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', { tier: 'project' }));
      await writeFile(join(workingDir, 'b.md'), makeMemoryFile('b', { tier: 'working' }));

      const index = await buildIndex(testDir);
      expect(Object.keys(index.entries)).toHaveLength(2);
      expect(index.entries['a'].tier).toBe('project');
      expect(index.entries['b'].tier).toBe('working');
    });
  });

  describe('saveIndex + loadIndex', () => {
    it('round-trips index to disk', async () => {
      const index = await buildIndex(testDir);
      index.entries['test'] = {
        id: 'test', title: 'Test', type: 'insight', tier: 'project',
        tags: ['a'], timestamp: '2026-01-01T00:00:00Z', confidence: 0.9, source: 'manual',
      };

      await saveIndex(testDir, index);
      const loaded = await loadIndex(testDir);

      expect(loaded.ok).toBe(true);
      if (loaded.ok) {
        expect(loaded.value.entries['test'].title).toBe('Test');
      }
    });

    it('returns error for missing index', async () => {
      const loaded = await loadIndex(testDir);
      expect(loaded.ok).toBe(false);
    });
  });

  describe('ensureIndex', () => {
    it('rebuilds index if missing', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      await writeFile(join(projectDir, 'x.md'), makeMemoryFile('x'));

      const index = await ensureIndex(testDir);
      expect(index.entries['x']).toBeDefined();

      // Verify it was persisted
      const loaded = await loadIndex(testDir);
      expect(loaded.ok).toBe(true);
    });
  });

  describe('updateIndexEntry + removeIndexEntry', () => {
    it('adds and removes entries', async () => {
      const entry = makeMockEntry('new-mem');
      await updateIndexEntry(testDir, entry);

      let index = await ensureIndex(testDir);
      expect(index.entries['new-mem']).toBeDefined();

      await removeIndexEntry(testDir, 'new-mem');

      const loaded = await loadIndex(testDir);
      expect(loaded.ok).toBe(true);
      if (loaded.ok) {
        expect(loaded.value.entries['new-mem']).toBeUndefined();
      }
    });
  });

  describe('validateIndex', () => {
    it('reports no issues for synced index', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a'));

      // Build and save index
      const index = await buildIndex(testDir);
      await saveIndex(testDir, index);

      const issues = await validateIndex(testDir);
      expect(issues.missingInIndex).toHaveLength(0);
      expect(issues.orphanedInIndex).toHaveLength(0);
      expect(issues.stale).toHaveLength(0);
    });

    it('detects missing entries in index', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      // Build index first (empty)
      await saveIndex(testDir, await buildIndex(testDir));
      // Then add a file
      await writeFile(join(projectDir, 'new.md'), makeMemoryFile('new'));

      const issues = await validateIndex(testDir);
      expect(issues.missingInIndex).toContain('new');
    });

    it('detects orphaned entries in index', async () => {
      // Create index with a phantom entry
      const index = await buildIndex(testDir);
      index.entries['ghost'] = {
        id: 'ghost', title: 'Ghost', type: 'insight', tier: 'project',
        tags: [], timestamp: '2026-01-01T00:00:00Z', confidence: 0.5, source: 'manual',
      };
      await saveIndex(testDir, index);

      const issues = await validateIndex(testDir);
      expect(issues.orphanedInIndex).toContain('ghost');
    });
  });
});
