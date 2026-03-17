import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import { createMemory, readMemory } from '../../../../src/core/memory/memory-store.js';
import { coordinatedWrite } from '../../../../src/core/coordination/shared-state.js';
import { isLocked } from '../../../../src/core/coordination/lock-manager.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('shared-state coordinatedWrite', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-shared-'));
    knowledgeDir = testDir;
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('writes memory with lock coordination', async () => {
    const entry: MemoryEntry = {
      id: 'coordinated-test',
      title: 'Coordinated write',
      type: 'insight',
      tier: 'project',
      source: 'test',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['test'],
      content: 'Written with coordination',
    };

    const result = await coordinatedWrite(testDir, entry, 'agent-1');
    expect(result.ok).toBe(true);

    // Verify memory was written
    const read = await readMemory(testDir, 'coordinated-test', 'project');
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.value.title).toBe('Coordinated write');
    }

    // Lock should be released after write
    const locked = await isLocked(testDir, 'memory-write');
    expect(locked).toBeNull();
  });

  it('releases lock even on write error', async () => {
    const badEntry: MemoryEntry = {
      id: '', // Empty ID will likely cause issues
      title: 'Bad entry',
      type: 'insight',
      tier: 'project',
      source: 'test',
      timestamp: new Date().toISOString(),
      confidence: 0.5,
      tags: [],
      content: 'Should fail or succeed, but lock must release',
    };

    await coordinatedWrite(testDir, badEntry, 'agent-1');

    // Lock must be released regardless
    const locked = await isLocked(testDir, 'memory-write');
    expect(locked).toBeNull();
  });
});
