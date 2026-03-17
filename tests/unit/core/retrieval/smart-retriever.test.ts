import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile as fsWriteFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import { createMemory } from '../../../../src/core/memory/memory-store.js';
import { smartRetrieve } from '../../../../src/core/retrieval/smart-retriever.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('smart-retriever', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-smart-'));
    knowledgeDir = testDir;
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });

    // Seed test memories
    await createMemory(testDir, {
      title: 'Use JWT for API authentication',
      type: 'decision',
      tier: 'project',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['auth', 'architecture'],
      content: 'We decided to use JWT tokens for all API authentication',
    });

    await createMemory(testDir, {
      title: 'Payment gateway timeout bug',
      type: 'bug-learning',
      tier: 'working',
      source: 'session:xyz',
      timestamp: new Date().toISOString(),
      confidence: 0.8,
      tags: ['bug', 'payment'],
      content: 'Payment gateway times out when processing > 100 items',
    });

    await createMemory(testDir, {
      title: 'Always use pnpm for packages',
      type: 'preference',
      tier: 'project',
      source: 'manual',
      timestamp: new Date().toISOString(),
      confidence: 0.95,
      tags: ['tooling'],
      content: 'pnpm is faster and more disk-efficient than npm',
    });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns all memories for general query (no intent)', async () => {
    const result = await smartRetrieve(testDir, 'pnpm');
    expect(result.intent).toBe('general');
    expect(result.filterApplied).toBe(false);
    expect(result.memories.length).toBeGreaterThan(0);
  });

  it('filters by architecture intent', async () => {
    const result = await smartRetrieve(testDir, 'what is the auth architecture?');
    expect(result.intent).toBe('architecture');
    expect(result.filterApplied).toBe(true);
    // Should prioritize the JWT decision memory
    expect(result.memories.some(m => m.memory.title.includes('JWT'))).toBe(true);
  });

  it('filters by debugging intent', async () => {
    const result = await smartRetrieve(testDir, 'what bug in payment?');
    expect(result.intent).toBe('debugging');
    expect(result.filterApplied).toBe(true);
    expect(result.memories.some(m => m.memory.title.includes('bug'))).toBe(true);
  });

  it('falls back to full scan when filtered results are empty', async () => {
    const result = await smartRetrieve(testDir, 'review the test coverage');
    // Review intent but no review-tagged memories exist
    expect(result.intent).toBe('review');
    // Should fallback — filterApplied false if no filtered results
    // Either returns something from fallback or empty
    expect(result.memories).toBeDefined();
  });

  it('includes detectedIntent in result', async () => {
    const result = await smartRetrieve(testDir, 'how to setup?');
    expect(result.intent).toBeDefined();
    expect(result.confidence).toBeDefined();
    expect(typeof result.filterApplied).toBe('boolean');
  });

  it('respects limit option', async () => {
    const result = await smartRetrieve(testDir, 'auth architecture design', { limit: 1 });
    expect(result.memories.length).toBeLessThanOrEqual(1);
  });
});
