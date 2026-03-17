import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { extractInsights } from '../../../../src/core/session/insight-extractor.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';

describe('insight-extractor', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-insight-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns ok result', async () => {
    const result = await extractInsights(testDir, new Date().toISOString());
    expect(result.ok).toBe(true);
  });

  it('extracts session duration insight', async () => {
    const twoMinsAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    const result = await extractInsights(testDir, twoMinsAgo);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const durationInsight = result.value.find((i) => i.summary.includes('lasted'));
      expect(durationInsight).toBeDefined();
    }
  });

  it('returns empty array for no git context', async () => {
    // testDir is not a git repo, so no git insights
    const result = await extractInsights(testDir, new Date().toISOString());
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Only session duration possible, but 0 mins = nothing
      const gitInsights = result.value.filter((i) => i.summary.includes('Changed'));
      expect(gitInsights).toHaveLength(0);
    }
  });
});
