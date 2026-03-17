import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeMemory, readMemory, listMemories, countMemories, createMemory, deleteMemory, toSlug } from '../../../../src/core/memory/memory-store.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

describe('memory-store', () => {
  let testDir: string;

  const mockMemory: MemoryEntry = {
    id: 'test-memory',
    title: 'Test insight about auth',
    type: 'insight',
    tier: 'project',
    source: 'session:abc123',
    timestamp: '2026-03-17T09:00:00.000Z',
    confidence: 0.8,
    tags: ['auto-extracted'],
    content: 'This is a test insight about authentication patterns.',
  };

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-mem-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('YAML frontmatter format', () => {
    it('writes memory as .md with YAML frontmatter', async () => {
      await writeMemory(testDir, mockMemory);
      const raw = await readFile(join(testDir, '.agent', 'project', 'test-memory.md'), 'utf-8');
      expect(raw).toContain('---');
      expect(raw).toContain('id: test-memory');
      expect(raw).toContain('type: insight');
      expect(raw).toContain('This is a test insight');
    });

    it('round-trips through write→read', async () => {
      await writeMemory(testDir, mockMemory);
      const result = await readMemory(testDir, 'test-memory');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('test-memory');
        expect(result.value.title).toBe('Test insight about auth');
        expect(result.value.type).toBe('insight');
        expect(result.value.tier).toBe('project');
        expect(result.value.confidence).toBe(0.8);
        expect(result.value.tags).toContain('auto-extracted');
      }
    });
  });

  describe('slug generation', () => {
    it('converts title to kebab-case', () => {
      expect(toSlug('Fix Auth Bug')).toBe('fix-auth-bug');
      expect(toSlug('API limit: 100/min')).toBe('api-limit-100-min');
      expect(toSlug('  Spaces  and--dashes  ')).toBe('spaces-and-dashes');
    });
  });

  describe('createMemory with dedup', () => {
    it('creates memory with slug ID', async () => {
      const result = await createMemory(testDir, {
        title: 'Fix Auth Bug',
        type: 'bug-learning',
        tier: 'project',
        source: 'session:abc',
        timestamp: '2026-03-17T09:00:00.000Z',
        confidence: 1,
        tags: [],
        content: 'Use JWT refresh tokens.',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('fix-auth-bug');
      }
    });

    it('deduplicates slug on collision', async () => {
      await writeMemory(testDir, { ...mockMemory, id: 'fix-auth-bug' });
      const result = await createMemory(testDir, {
        title: 'Fix Auth Bug',
        type: 'insight',
        tier: 'project',
        source: 'session:def',
        timestamp: '2026-03-17T10:00:00.000Z',
        confidence: 0.8,
        tags: [],
        content: 'Duplicate fix.',
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('fix-auth-bug-1');
      }
    });
  });

  describe('CRUD', () => {
    it('lists memories', async () => {
      await writeMemory(testDir, mockMemory);
      await writeMemory(testDir, { ...mockMemory, id: 'second-memory', title: 'Second' });
      const result = await listMemories(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toHaveLength(2);
    });

    it('counts memories', async () => {
      expect(await countMemories(testDir)).toBe(0);
      await writeMemory(testDir, mockMemory);
      expect(await countMemories(testDir)).toBe(1);
    });

    it('deletes a memory', async () => {
      await writeMemory(testDir, mockMemory);
      expect(await countMemories(testDir)).toBe(1);
      const result = await deleteMemory(testDir, 'test-memory');
      expect(result.ok).toBe(true);
      expect(await countMemories(testDir)).toBe(0);
    });
  });
});
