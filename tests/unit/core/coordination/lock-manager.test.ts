import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import {
  acquireLock,
  releaseLock,
  forceReleaseLock,
  isLocked,
  listLocks,
} from '../../../../src/core/coordination/lock-manager.js';

describe('lock-manager', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-lock-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(agentDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('acquires and releases a lock', async () => {
    const result = await acquireLock(testDir, 'test-resource', 'agent-1');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.agentId).toBe('agent-1');
    expect(result.value.resource).toBe('test-resource');

    // Verify locked
    const locked = await isLocked(testDir, 'test-resource');
    expect(locked).not.toBeNull();
    expect(locked!.agentId).toBe('agent-1');

    // Release
    const releaseResult = await releaseLock(testDir, 'test-resource', 'agent-1');
    expect(releaseResult.ok).toBe(true);

    // Verify unlocked
    const after = await isLocked(testDir, 'test-resource');
    expect(after).toBeNull();
  });

  it('prevents double acquisition', async () => {
    await acquireLock(testDir, 'resource-x', 'agent-1');
    const second = await acquireLock(testDir, 'resource-x', 'agent-2');
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.error.message).toContain('locked by');
    }
  });

  it('prevents release by non-owner', async () => {
    await acquireLock(testDir, 'resource-y', 'agent-1');
    const result = await releaseLock(testDir, 'resource-y', 'agent-2');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('owned by');
    }
  });

  it('force-releases regardless of owner', async () => {
    await acquireLock(testDir, 'resource-z', 'agent-1');
    const result = await forceReleaseLock(testDir, 'resource-z');
    expect(result.ok).toBe(true);

    const locked = await isLocked(testDir, 'resource-z');
    expect(locked).toBeNull();
  });

  it('auto-expires stale locks', async () => {
    // Acquire with 1ms TTL (instantly expired)
    await acquireLock(testDir, 'stale-resource', 'agent-1', 1);

    // Wait a tiny bit to ensure expiry
    await new Promise(r => setTimeout(r, 10));

    // Should be expired
    const locked = await isLocked(testDir, 'stale-resource');
    expect(locked).toBeNull();

    // Should be able to acquire again
    const result = await acquireLock(testDir, 'stale-resource', 'agent-2');
    expect(result.ok).toBe(true);
  });

  it('lists active locks', async () => {
    await acquireLock(testDir, 'lock-a', 'agent-1');
    await acquireLock(testDir, 'lock-b', 'agent-2');

    const locks = await listLocks(testDir);
    expect(locks.length).toBe(2);

    const resources = locks.map(l => l.resource);
    expect(resources).toContain('lock-a');
    expect(resources).toContain('lock-b');
  });

  it('lists empty when no locks', async () => {
    const locks = await listLocks(testDir);
    expect(locks).toHaveLength(0);
  });

  it('isLocked returns null for non-existent resource', async () => {
    const result = await isLocked(testDir, 'nonexistent');
    expect(result).toBeNull();
  });
});
