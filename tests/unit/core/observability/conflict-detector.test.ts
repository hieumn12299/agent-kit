import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { detectConflicts } from '../../../../src/core/observability/conflict-detector.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';

const makeMemoryFile = (id: string, opts: {
  title?: string;
  tier?: string;
  tags?: string[];
} = {}) => {
  const title = opts.title ?? id;
  const tier = opts.tier ?? 'project';
  const tags = opts.tags ?? ['test'];

  return [
    '---',
    `id: ${id}`,
    `title: "${title}"`,
    `type: insight`,
    `tier: ${tier}`,
    `source: manual`,
    `timestamp: ${new Date().toISOString()}`,
    `confidence: 0.8`,
    `tags: [${tags.map(t => `"${t}"`).join(', ')}]`,
    '---',
    '',
    'Content',
    '',
  ].join('\n');
};

describe('conflict-detector', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-conflict-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns empty for no conflicts', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');
    await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', { title: 'Alpha', tags: ['api'] }));
    await writeFile(join(projectDir, 'b.md'), makeMemoryFile('b', { title: 'Beta', tags: ['db'] }));

    const conflicts = await detectConflicts(testDir);
    expect(conflicts).toEqual([]);
  });

  it('detects duplicate titles across tiers', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');
    const workingDir = join(getAgentPath(testDir), 'working');

    await writeFile(join(projectDir, 'use-jwt.md'), makeMemoryFile('use-jwt', { title: 'Use JWT Auth', tier: 'project' }));
    await writeFile(join(workingDir, 'use-jwt-2.md'), makeMemoryFile('use-jwt-2', { title: 'Use JWT Auth', tier: 'working' }));

    const conflicts = await detectConflicts(testDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('duplicate');
    expect(conflicts[0].suggestion).toContain('Use JWT Auth');
  });

  it('detects similar memories with >50% tag overlap', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');
    const workingDir = join(getAgentPath(testDir), 'working');

    await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', {
      title: 'API Design', tier: 'project', tags: ['api', 'rest', 'design'],
    }));
    await writeFile(join(workingDir, 'b.md'), makeMemoryFile('b', {
      title: 'REST Patterns', tier: 'working', tags: ['api', 'rest', 'patterns'],
    }));

    const conflicts = await detectConflicts(testDir);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('similar');
    expect(conflicts[0].suggestion).toContain('API Design');
  });

  it('ignores same-tier similar memories', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');

    await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', { tags: ['api', 'rest'] }));
    await writeFile(join(projectDir, 'b.md'), makeMemoryFile('b', { title: 'b', tags: ['api', 'rest'] }));

    const conflicts = await detectConflicts(testDir);
    expect(conflicts).toEqual([]);
  });

  it('does not flag memories with low tag overlap', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');
    const workingDir = join(getAgentPath(testDir), 'working');

    await writeFile(join(projectDir, 'a.md'), makeMemoryFile('a', {
      tier: 'project', tags: ['api', 'rest', 'design', 'v2'],
    }));
    await writeFile(join(workingDir, 'b.md'), makeMemoryFile('b', {
      tier: 'working', tags: ['db', 'schema', 'migration', 'api'],
    }));

    const conflicts = await detectConflicts(testDir);
    // 1/7 overlap = 14% < 50% threshold
    expect(conflicts).toEqual([]);
  });

  it('deduplicates pair that is both duplicate and similar', async () => {
    const projectDir = join(getAgentPath(testDir), 'project');
    const workingDir = join(getAgentPath(testDir), 'working');

    // Same title AND high tag overlap
    await writeFile(join(projectDir, 'api.md'), makeMemoryFile('api', {
      title: 'API Rules', tier: 'project', tags: ['api', 'rest'],
    }));
    await writeFile(join(workingDir, 'api-2.md'), makeMemoryFile('api-2', {
      title: 'API Rules', tier: 'working', tags: ['api', 'rest'],
    }));

    const conflicts = await detectConflicts(testDir);
    // Should only report as duplicate, not both duplicate + similar
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('duplicate');
  });
});
