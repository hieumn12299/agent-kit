import { describe, it, expect } from 'vitest';
import { promoteInsight, promoteAll } from '../../../../src/core/memory/promoter.js';
import type { Insight } from '../../../../src/core/session/insight-extractor.js';

describe('promoter', () => {
  const mockInsight: Insight = {
    summary: 'Fixed auth: use JWT refresh',
    source: 'git-diff',
  };

  it('promotes insight to MemoryEntry with kebab-case slug', () => {
    const entry = promoteInsight(mockInsight, 'abcdef1234567890', 0);
    expect(entry.id).toBe('fixed-auth-use-jwt-refresh-0');
    expect(entry.title).toBe('Fixed auth: use JWT refresh');
    expect(entry.type).toBe('insight');
    expect(entry.tier).toBe('project');
    expect(entry.source).toBe('session:abcdef1234567890');
    expect(entry.confidence).toBe(0.8);
    expect(entry.tags).toContain('auto-extracted');
  });

  it('promoteAll converts batch', () => {
    const insights: Insight[] = [
      mockInsight,
      { summary: 'API limit: 100/min', source: 'git-diff' },
    ];
    const entries = promoteAll(insights, 'session123');
    expect(entries).toHaveLength(2);
    expect(entries[0].id).toBe('fixed-auth-use-jwt-refresh-0');
    expect(entries[1].id).toBe('api-limit-100-min-1');
  });
});
