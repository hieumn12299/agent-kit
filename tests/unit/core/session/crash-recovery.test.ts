import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { startSession, endSession } from '../../../../src/core/session/session-manager.js';
import { readLock } from '../../../../src/core/session/session-lock.js';
import { ensureStructure, getSubPath, WORKING_DIR } from '../../../../src/utils/file-system.js';
import { readdir } from 'node:fs/promises';

describe('crash-recovery', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-crash-'));
    await ensureStructure(testDir);
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('endSession clears working directory', async () => {
    const result = await startSession(testDir);
    expect(result.ok).toBe(true);

    if (result.ok && result.value.kind === 'started') {
      // Create a file in working dir
      const workingPath = getSubPath(testDir, WORKING_DIR);
      await writeFile(join(workingPath, 'scratch.txt'), 'temp data', 'utf-8');

      // Verify file exists
      let files = await readdir(workingPath);
      expect(files).toContain('scratch.txt');

      // End session
      await endSession(testDir, result.value.session);

      // Working dir should be cleared
      files = await readdir(workingPath);
      expect(files).toHaveLength(0);
    }
  });

  it('endSession releases lock file', async () => {
    const result = await startSession(testDir);
    expect(result.ok).toBe(true);

    if (result.ok && result.value.kind === 'started') {
      // Lock should exist
      const lockBefore = await readLock(testDir);
      expect(lockBefore).not.toBeNull();

      await endSession(testDir, result.value.session);

      // Lock should be gone
      const lockAfter = await readLock(testDir);
      expect(lockAfter).toBeNull();
    }
  });

  it('startSession detects orphaned session after crash', async () => {
    // Simulate crash: start session but don't end it
    const first = await startSession(testDir);
    expect(first.ok).toBe(true);

    // Start again — should detect orphan
    const second = await startSession(testDir);
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.value.kind).toBe('orphaned');
    }
  });
});
