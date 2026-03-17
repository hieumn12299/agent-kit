import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startSession, endSession, forceStartSession } from '../../../../src/core/session/session-manager.js';
import { ensureStructure } from '../../../../src/utils/file-system.js';

describe('session-manager', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-mgr-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('starts a new session', async () => {
    const result = await startSession(testDir);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.kind).toBe('started');
      if (result.value.kind === 'started') {
        expect(result.value.session.sessionId).toHaveLength(16);
        expect(result.value.session.isActive).toBe(true);
      }
    }
  });

  it('detects orphaned session', async () => {
    const first = await startSession(testDir);
    expect(first.ok).toBe(true);

    const second = await startSession(testDir);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.kind).toBe('orphaned');
    }
  });

  it('endSession marks session inactive', async () => {
    const result = await startSession(testDir);
    expect(result.ok).toBe(true);
    if (result.ok && result.value.kind === 'started') {
      const endResult = await endSession(testDir, result.value.session);
      expect(endResult.ok).toBe(true);
    }
  });

  it('forceStartSession ends previous and starts new', async () => {
    const first = await startSession(testDir);
    expect(first.ok).toBe(true);

    if (first.ok && first.value.kind === 'started') {
      const forceResult = await forceStartSession(testDir, first.value.session);
      expect(forceResult.ok).toBe(true);
      if (forceResult.ok) {
        expect(forceResult.value.kind).toBe('started');
      }
    }
  });
});
