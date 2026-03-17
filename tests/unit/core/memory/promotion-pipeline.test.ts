import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import {
  promoteMemory,
  getDefaultPromotionTarget,
} from '../../../../src/core/memory/promoter.js';
import {
  createMemory,
  readMemory,
  listMemories,
} from '../../../../src/core/memory/memory-store.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('promoteMemory', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-promote-'));
    knowledgeDir = testDir;
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('getDefaultPromotionTarget returns correct next tier', () => {
    expect(getDefaultPromotionTarget('working')).toBe('project');
    expect(getDefaultPromotionTarget('project')).toBe('knowledge');
    expect(getDefaultPromotionTarget('knowledge')).toBeNull();
    expect(getDefaultPromotionTarget('private')).toBeNull();
  });

  it('promotes working → project', async () => {
    const created = await createMemory(testDir, {
      title: 'Use JWT Auth',
      type: 'decision',
      tier: 'working',
      source: 'session:abc',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['auth'],
      content: 'Use JWT for API auth',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await promoteMemory(testDir, created.value.id, 'working', 'project');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Verify promoted memory
    expect(result.value.tier).toBe('project');
    expect(result.value.source).toBe('promoted:from-working');

    // Verify source deleted
    const oldRead = await readMemory(testDir, created.value.id, 'working');
    expect(oldRead.ok).toBe(false);

    // Verify target exists
    const newRead = await readMemory(testDir, created.value.id, 'project');
    expect(newRead.ok).toBe(true);
  });

  it('promotes project → knowledge', async () => {
    const created = await createMemory(testDir, {
      title: 'Always use pnpm',
      type: 'preference',
      tier: 'project',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      tags: ['tooling'],
      content: 'pnpm is faster',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await promoteMemory(testDir, created.value.id, 'project', 'knowledge');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.tier).toBe('knowledge');
    expect(result.value.source).toBe('promoted:from-project');

    // Old location gone
    const oldRead = await readMemory(testDir, created.value.id, 'project');
    expect(oldRead.ok).toBe(false);

    // New location exists
    const knowledgeList = await listMemories(testDir, 'knowledge');
    expect(knowledgeList.ok).toBe(true);
    if (knowledgeList.ok) {
      expect(knowledgeList.value.some(m => m.id === created.value.id)).toBe(true);
    }
  });

  it('returns error for non-existent memory', async () => {
    const result = await promoteMemory(testDir, 'nonexistent', 'working', 'project');
    expect(result.ok).toBe(false);
  });

  it('appends -promoted suffix on ID conflict in target tier', async () => {
    // Create same-named memory in both tiers
    await createMemory(testDir, {
      id: 'use-jwt', title: 'Use JWT', type: 'decision', tier: 'project',
      source: 'manual', timestamp: new Date().toISOString(),
      confidence: 0.9, tags: ['auth'], content: 'Project version',
    });
    await createMemory(testDir, {
      id: 'use-jwt', title: 'Use JWT', type: 'decision', tier: 'working',
      source: 'session:xyz', timestamp: new Date().toISOString(),
      confidence: 0.85, tags: ['auth'], content: 'Working version',
    });

    const result = await promoteMemory(testDir, 'use-jwt', 'working', 'project');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // ID should be suffixed
    expect(result.value.id).toBe('use-jwt-promoted');
    expect(result.value.tier).toBe('project');

    // Both should exist in project now
    const original = await readMemory(testDir, 'use-jwt', 'project');
    const promoted = await readMemory(testDir, 'use-jwt-promoted', 'project');
    expect(original.ok).toBe(true);
    expect(promoted.ok).toBe(true);

    // Source should be gone
    const gone = await readMemory(testDir, 'use-jwt', 'working');
    expect(gone.ok).toBe(false);
  });
});
