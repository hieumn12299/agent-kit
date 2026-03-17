import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  getQualityMetrics,
  getMemoryEvolution,
  getFullAnalytics,
  parseSessionSource,
} from '../../../../src/core/observability/memory-analytics.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';

const makeMemoryFile = (id: string, opts: {
  type?: string;
  tier?: string;
  source?: string;
  timestamp?: string;
  confidence?: number;
  tags?: string[];
  content?: string;
} = {}) => {
  const type = opts.type ?? 'insight';
  const tier = opts.tier ?? 'project';
  const source = opts.source ?? 'manual';
  const timestamp = opts.timestamp ?? new Date().toISOString();
  const confidence = opts.confidence ?? 0.8;
  const tags = opts.tags ?? ['test'];
  const content = opts.content ?? 'Test memory content';

  return [
    '---',
    `id: ${id}`,
    `title: "${id}"`,
    `type: ${type}`,
    `tier: ${tier}`,
    `source: ${source}`,
    `timestamp: ${timestamp}`,
    `confidence: ${confidence}`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    '---',
    '',
    content,
    '',
  ].join('\n');
};

describe('memory-analytics', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-analytics-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
    await mkdir(join(agentDir, 'sessions'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('parseSessionSource', () => {
    it('parses session source correctly', () => {
      expect(parseSessionSource('session:abc123')).toEqual({ isSession: true, sessionId: 'abc123' });
    });

    it('returns false for non-session source', () => {
      expect(parseSessionSource('manual')).toEqual({ isSession: false });
      expect(parseSessionSource('correction:user')).toEqual({ isSession: false });
    });
  });

  describe('getQualityMetrics', () => {
    it('returns zeros for empty project', async () => {
      const result = await getQualityMetrics(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMemories).toBe(0);
        expect(result.value.staleRate).toBe(0);
        expect(result.value.avgConfidence).toBe(0);
      }
    });

    it('computes correct metrics for mixed memories', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      const now = new Date().toISOString();
      const old = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

      await writeFile(join(projectDir, 'mem-1.md'), makeMemoryFile('mem-1', {
        type: 'insight', confidence: 0.9, timestamp: now,
      }));
      await writeFile(join(projectDir, 'mem-2.md'), makeMemoryFile('mem-2', {
        type: 'decision', confidence: 0.7, timestamp: old, source: 'correction:user',
      }));
      await writeFile(join(projectDir, 'mem-3.md'), makeMemoryFile('mem-3', {
        type: 'insight', confidence: 0.8, timestamp: old,
      }));

      const result = await getQualityMetrics(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMemories).toBe(3);
        expect(result.value.staleCount).toBe(2);
        expect(result.value.staleRate).toBe(67);
        expect(result.value.correctionCount).toBe(1);
        expect(result.value.avgConfidence).toBe(0.8);
        expect(result.value.typeDistribution).toEqual({ insight: 2, decision: 1 });
      }
    });

    it('includes working-tier memories in metrics', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      const workingDir = join(getAgentPath(testDir), 'working');

      await writeFile(join(projectDir, 'p1.md'), makeMemoryFile('p1', { confidence: 0.9 }));
      await writeFile(join(workingDir, 'w1.md'), makeMemoryFile('w1', { tier: 'working', confidence: 0.7 }));

      const result = await getQualityMetrics(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMemories).toBe(2);
        expect(result.value.avgConfidence).toBe(0.8);
      }
    });
  });

  describe('getMemoryEvolution', () => {
    it('returns empty growth for project with no sessions', async () => {
      const result = await getMemoryEvolution(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMemories).toBe(0);
        expect(result.value.recentGrowth).toEqual([]);
      }
    });

    it('links memories to sessions via source field', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      const sessionsDir = join(getAgentPath(testDir), 'sessions');

      const session = {
        sessionId: 'sess-abc123',
        startTime: '2026-03-17T10:00:00Z',
        endTime: '2026-03-17T11:00:00Z',
        insights: [],
      };
      await writeFile(join(sessionsDir, 'sess-abc123.json'), JSON.stringify(session));

      await writeFile(join(projectDir, 'mem-a.md'), makeMemoryFile('mem-a', { source: 'session:sess-abc123' }));
      await writeFile(join(projectDir, 'mem-b.md'), makeMemoryFile('mem-b', { source: 'session:sess-abc123' }));
      await writeFile(join(projectDir, 'mem-c.md'), makeMemoryFile('mem-c', { source: 'manual' }));

      const result = await getMemoryEvolution(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.totalMemories).toBe(3);
        expect(result.value.sessionsWithNewMemories).toBe(1);
        expect(result.value.recentGrowth).toHaveLength(1);
        expect(result.value.recentGrowth[0].memoriesCreated).toBe(2);
      }
    });

    it('handles multiple sessions with different growth', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      const sessionsDir = join(getAgentPath(testDir), 'sessions');

      // Two sessions
      await writeFile(join(sessionsDir, 'sess-1.json'), JSON.stringify({
        sessionId: 'sess-1', startTime: '2026-03-16T10:00:00Z', endTime: '2026-03-16T11:00:00Z', insights: [],
      }));
      await writeFile(join(sessionsDir, 'sess-2.json'), JSON.stringify({
        sessionId: 'sess-2', startTime: '2026-03-17T10:00:00Z', endTime: '2026-03-17T11:00:00Z', insights: [],
      }));

      // Session 1: 1 memory, Session 2: 3 memories
      await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', { source: 'session:sess-1' }));
      await writeFile(join(projectDir, 'b.md'), makeMemoryFile('b', { source: 'session:sess-2' }));
      await writeFile(join(projectDir, 'c.md'), makeMemoryFile('c', { source: 'session:sess-2' }));
      await writeFile(join(projectDir, 'd.md'), makeMemoryFile('d', { source: 'session:sess-2' }));

      const result = await getMemoryEvolution(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sessionsWithNewMemories).toBe(2);
        expect(result.value.recentGrowth).toHaveLength(2);
        // Most recent first
        expect(result.value.recentGrowth[0].sessionId).toBe('sess-2');
        expect(result.value.recentGrowth[0].memoriesCreated).toBe(3);
        expect(result.value.recentGrowth[1].sessionId).toBe('sess-1');
        expect(result.value.recentGrowth[1].memoriesCreated).toBe(1);
      }
    });
  });

  describe('getFullAnalytics', () => {
    it('returns both evolution and quality in single call', async () => {
      const projectDir = join(getAgentPath(testDir), 'project');
      await writeFile(join(projectDir, 'mem.md'), makeMemoryFile('mem', { confidence: 0.9 }));

      const result = await getFullAnalytics(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.evolution.totalMemories).toBe(1);
        expect(result.value.quality.totalMemories).toBe(1);
        expect(result.value.quality.avgConfidence).toBe(0.9);
      }
    });
  });
});
