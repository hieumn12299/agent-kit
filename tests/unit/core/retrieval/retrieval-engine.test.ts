import { describe, it, expect } from 'vitest';
import { scoreMemory, searchMemories, formatScoredMemory } from '../../../../src/core/retrieval/retrieval-engine.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

const makeMemory = (overrides: Partial<MemoryEntry>): MemoryEntry => ({
  id: 'test-memory',
  title: 'Test Memory',
  type: 'insight',
  tier: 'project',
  source: 'session:abc',
  timestamp: new Date().toISOString(),
  confidence: 0.8,
  tags: [],
  content: 'Default content.',
  ...overrides,
});

describe('retrieval-engine', () => {
  describe('scoreMemory', () => {
    it('scores matching memory > 0', () => {
      const m = makeMemory({ title: 'JWT auth pattern', content: 'Use refresh tokens for auth.' });
      const score = scoreMemory(m, 'auth');
      expect(score).toBeGreaterThan(0);
    });

    it('scores non-matching memory at 0', () => {
      const m = makeMemory({ title: 'Database setup', content: 'Configure postgres.' });
      const score = scoreMemory(m, 'authentication');
      expect(score).toBe(0);
    });

    it('scores multi-keyword match higher', () => {
      const m = makeMemory({ title: 'JWT auth refresh', content: 'Use refresh tokens for JWT auth.' });
      const scoreOne = scoreMemory(m, 'auth');
      const scoreMulti = scoreMemory(m, 'auth JWT');
      expect(scoreMulti).toBeGreaterThanOrEqual(scoreOne);
    });

    it('applies recency decay to older memories', () => {
      const fresh = makeMemory({ title: 'auth fix', timestamp: new Date().toISOString() });
      const old = makeMemory({
        title: 'auth fix',
        timestamp: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      });
      expect(scoreMemory(fresh, 'auth')).toBeGreaterThan(scoreMemory(old, 'auth'));
    });
  });

  describe('searchMemories', () => {
    it('returns scored results sorted by score', () => {
      const memories = [
        makeMemory({ id: 'a', title: 'Database setup', content: 'Postgres config.' }),
        makeMemory({ id: 'b', title: 'Auth pattern', content: 'JWT auth token handling.' }),
        makeMemory({ id: 'c', title: 'Auth bug fix', content: 'Fixed auth refresh token.' }),
      ];
      const results = searchMemories(memories, 'auth');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].score).toBeGreaterThanOrEqual(results[results.length - 1].score);
      // Database should not match auth
      expect(results.find((r) => r.memory.id === 'a')).toBeUndefined();
    });

    it('returns empty for no matches', () => {
      const memories = [makeMemory({ title: 'Foo', content: 'Bar.' })];
      const results = searchMemories(memories, 'zzzznotfound');
      expect(results).toHaveLength(0);
    });
  });

  describe('formatScoredMemory', () => {
    it('formats in UX-DR7 style', () => {
      const sm = {
        memory: makeMemory({ title: 'Auth Pattern', timestamp: '2026-03-17T09:00:00.000Z' }),
        score: 0.85,
      };
      const output = formatScoredMemory(sm);
      expect(output).toContain('## [85%] Auth Pattern');
      expect(output).toContain('*project · 2026-03-17*');
    });
  });
});
