import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeMemory, readMemory, listMemories, listCorruptedFiles } from '../../../../src/core/memory/memory-store.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

describe('resilience', () => {
  let testDir: string;

  const mockMemory: MemoryEntry = {
    id: 'test-resilient',
    title: 'Resilient memory',
    type: 'insight',
    tier: 'project',
    source: 'session:abc',
    timestamp: '2026-03-17T09:00:00.000Z',
    confidence: 0.8,
    tags: ['test'],
    content: 'Test content for resilience.',
  };

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-resilience-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('isolates corrupted files and loads others (Story 7.2)', async () => {
    // Write a valid memory
    await writeMemory(testDir, mockMemory);

    // Write a corrupted file directly
    await writeFile(
      join(testDir, '.agent', 'project', 'corrupted.md'),
      'THIS IS NOT VALID YAML FRONTMATTER',
      'utf-8',
    );

    // listMemories should return only the valid one
    const result = await listMemories(testDir, 'project');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].id).toBe('test-resilient');
    }
  });

  it('lists corrupted files (Story 7.2)', async () => {
    await writeMemory(testDir, mockMemory);
    await writeFile(
      join(testDir, '.agent', 'project', 'bad-file.md'),
      'not valid yaml',
      'utf-8',
    );

    const corrupted = await listCorruptedFiles(testDir, 'project');
    expect(corrupted).toContain('bad-file.md');
    expect(corrupted).not.toContain('test-resilient.md');
  });

  it('supports private tier (Story 7.3)', async () => {
    const privateMemory: MemoryEntry = {
      ...mockMemory,
      id: 'private-secret',
      tier: 'private',
    };
    const result = await writeMemory(testDir, privateMemory);
    expect(result.ok).toBe(true);

    const read = await readMemory(testDir, 'private-secret', 'private');
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.value.tier).toBe('private');
    }
  });

  it('one-file-per-memory prevents merge conflicts (Story 7.1)', async () => {
    // Each memory is its own .md file — git merges only conflict on same-file edits
    await writeMemory(testDir, { ...mockMemory, id: 'memory-a' });
    await writeMemory(testDir, { ...mockMemory, id: 'memory-b' });

    const result = await listMemories(testDir, 'project');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      const ids = result.value.map((m) => m.id);
      expect(ids).toContain('memory-a');
      expect(ids).toContain('memory-b');
    }
  });
});
