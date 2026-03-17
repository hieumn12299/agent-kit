import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { acquireLock, readLock, releaseLock, timeAgo } from '../../../../src/core/session/session-lock.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';

describe('session-lock', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-lock-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('acquireLock', () => {
    it('acquires lock when no existing lock', async () => {
      const result = await acquireLock(testDir, 'sess-001');
      expect(result.ok).toBe(true);
    });

    it('returns existing lock info on conflict', async () => {
      await acquireLock(testDir, 'sess-001');
      const result = await acquireLock(testDir, 'sess-002');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.sessionId).toBe('sess-001');
      }
    });
  });

  describe('readLock', () => {
    it('returns null when no lock', async () => {
      const lock = await readLock(testDir);
      expect(lock).toBeNull();
    });

    it('reads existing lock', async () => {
      await acquireLock(testDir, 'sess-123');
      const lock = await readLock(testDir);
      expect(lock).not.toBeNull();
      expect(lock?.sessionId).toBe('sess-123');
      expect(lock?.pid).toBe(process.pid);
    });
  });

  describe('releaseLock', () => {
    it('releases existing lock', async () => {
      await acquireLock(testDir, 'sess-001');
      await releaseLock(testDir);
      const lock = await readLock(testDir);
      expect(lock).toBeNull();
    });

    it('does not throw on missing lock', async () => {
      await expect(releaseLock(testDir)).resolves.not.toThrow();
    });
  });

  describe('timeAgo', () => {
    it('shows minutes', () => {
      const date = new Date(Date.now() - 5 * 60_000).toISOString();
      expect(timeAgo(date)).toBe('5m ago');
    });

    it('shows hours', () => {
      const date = new Date(Date.now() - 3 * 3600_000).toISOString();
      expect(timeAgo(date)).toBe('3h ago');
    });

    it('shows days', () => {
      const date = new Date(Date.now() - 2 * 86400_000).toISOString();
      expect(timeAgo(date)).toBe('2d ago');
    });
  });
});
