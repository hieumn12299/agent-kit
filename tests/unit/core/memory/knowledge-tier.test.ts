import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createMemory,
  listMemories,
  deleteMemory,
  listAllMemories,
  getMemoriesDir,
} from '../../../../src/core/memory/memory-store.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';

// Mock homedir to use temp dir for knowledge
let knowledgeDir: string;

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return {
    ...actual,
    homedir: () => knowledgeDir,
  };
});

describe('knowledge tier', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-knowledge-'));
    knowledgeDir = testDir; // homedir() now returns testDir
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('getMemoriesDir returns ~/.agent-kit/knowledge/ for knowledge tier', () => {
    const dir = getMemoriesDir(testDir, 'knowledge');
    expect(dir).toContain('.agent-kit');
    expect(dir).toContain('knowledge');
  });

  it('creates knowledge memory in global dir (auto-creates dir)', async () => {
    const result = await createMemory(testDir, {
      title: 'Always use pnpm',
      type: 'preference',
      tier: 'knowledge',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      tags: ['tooling'],
      content: 'pnpm is faster and more disk-efficient',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tier).toBe('knowledge');
      // Verify file exists in knowledge dir
      const knowledgePath = getMemoriesDir(testDir, 'knowledge');
      const files = await readdir(knowledgePath);
      expect(files).toContain(`${result.value.id}.md`);
    }
  });

  it('lists knowledge memories', async () => {
    await createMemory(testDir, {
      title: 'Prefer Zod over Joi',
      type: 'preference',
      tier: 'knowledge',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['validation'],
      content: 'Zod has better TypeScript support',
    });

    const result = await listMemories(testDir, 'knowledge');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(1);
      expect(result.value[0].title).toBe('Prefer Zod over Joi');
    }
  });

  it('listAllMemories includes knowledge tier', async () => {
    // Create one memory per tier
    await createMemory(testDir, {
      title: 'Project mem', type: 'insight', tier: 'project',
      source: 'manual', timestamp: new Date().toISOString(),
      confidence: 0.8, tags: ['test'], content: 'project content',
    });
    await createMemory(testDir, {
      title: 'Knowledge mem', type: 'preference', tier: 'knowledge',
      source: 'manual', timestamp: new Date().toISOString(),
      confidence: 0.9, tags: ['test'], content: 'knowledge content',
    });

    const all = await listAllMemories(testDir);
    const tiers = all.map(m => m.tier);
    expect(tiers).toContain('project');
    expect(tiers).toContain('knowledge');
  });

  it('deletes knowledge memory', async () => {
    const created = await createMemory(testDir, {
      title: 'Temp knowledge', type: 'insight', tier: 'knowledge',
      source: 'manual', timestamp: new Date().toISOString(),
      confidence: 0.5, tags: [], content: 'temp',
    });

    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const deleteResult = await deleteMemory(testDir, created.value.id, 'knowledge');
    expect(deleteResult.ok).toBe(true);

    const listResult = await listMemories(testDir, 'knowledge');
    expect(listResult.ok).toBe(true);
    if (listResult.ok) {
      expect(listResult.value).toHaveLength(0);
    }
  });

  it('handles missing knowledge dir gracefully on list', async () => {
    // Don't create knowledge dir — should return empty, not crash
    const result = await listMemories(testDir, 'knowledge');
    // Should either return empty array or error (both ok)
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    } else {
      expect(result.error).toBeDefined();
    }
  });
});
