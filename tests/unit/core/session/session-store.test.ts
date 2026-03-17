import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeSession, readSession, listSessions, getActiveSession } from '../../../../src/core/session/session-store.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';
import type { SessionMetadata } from '../../../../src/types/session.js';

describe('session-store', () => {
  let testDir: string;

  const mockSession: SessionMetadata = {
    sessionId: 'test-abc123',
    startTime: '2026-03-17T09:00:00.000Z',
    isActive: true,
  };

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-session-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('writeSession + readSession', () => {
    it('writes and reads a session', async () => {
      const writeResult = await writeSession(testDir, mockSession);
      expect(writeResult.ok).toBe(true);

      const readResult = await readSession(testDir, 'test-abc123');
      expect(readResult.ok).toBe(true);
      if (readResult.ok) {
        expect(readResult.value.sessionId).toBe('test-abc123');
        expect(readResult.value.isActive).toBe(true);
      }
    });

    it('returns Err for non-existent session', async () => {
      const result = await readSession(testDir, 'nonexistent');
      expect(result.ok).toBe(false);
    });
  });

  describe('listSessions', () => {
    it('returns empty array when no sessions', async () => {
      const result = await listSessions(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it('lists multiple sessions', async () => {
      await writeSession(testDir, mockSession);
      await writeSession(testDir, { ...mockSession, sessionId: 'test-def456', isActive: false });

      const result = await listSessions(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveLength(2);
      }
    });
  });

  describe('getActiveSession', () => {
    it('returns null when no active session', async () => {
      const result = await getActiveSession(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('returns active session', async () => {
      await writeSession(testDir, mockSession);
      const result = await getActiveSession(testDir);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value?.sessionId).toBe('test-abc123');
      }
    });
  });
});
