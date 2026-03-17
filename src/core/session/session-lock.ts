import { readFile, writeFile, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '../../types/result.js';
import { getAgentPath } from '../../utils/file-system.js';

const LOCK_FILE = '.session.lock';
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface LockInfo {
  pid: number;
  sessionId: string;
  startTime: string;
}

const lockPath = (root: string): string => join(getAgentPath(root), LOCK_FILE);

/**
 * Check if a process is still running.
 */
const isProcessRunning = (pid: number): boolean => {
  try {
    process.kill(pid, 0); // signal 0 = check existence
    return true;
  } catch {
    return false;
  }
};

/**
 * Compute a human-readable "time ago" string.
 */
export const timeAgo = (isoDate: string): string => {
  const ms = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Acquire a session lock. Returns existing lock info if already locked.
 */
export const acquireLock = async (
  root: string,
  sessionId: string,
): Promise<Result<null, LockInfo>> => {
  // Check existing lock
  const existing = await readLock(root);
  if (existing) {
    // Auto-clean stale locks
    const age = Date.now() - new Date(existing.startTime).getTime();
    const ageMs = isNaN(age) ? STALE_THRESHOLD_MS + 1 : age; // Invalid date = treat as stale
    const stale = ageMs > STALE_THRESHOLD_MS || !isProcessRunning(existing.pid);

    if (stale) {
      await releaseLock(root);
    } else {
      return err(existing);
    }
  }

  // Write lock atomically using exclusive create (flag 'wx')
  const info: LockInfo = {
    pid: process.pid,
    sessionId,
    startTime: new Date().toISOString(),
  };

  try {
    await writeFile(lockPath(root), JSON.stringify(info), { encoding: 'utf-8', flag: 'wx' });
    return ok(null);
  } catch {
    // Another process acquired the lock between our check and write — re-read to get their info
    const raced = await readLock(root);
    if (raced) return err(raced);
    // Lock file disappeared between write failure and re-read — should not normally happen
    return err({ pid: 0, sessionId: 'unknown', startTime: new Date().toISOString() });
  }
};

/**
 * Read existing lock file, or null if none.
 */
export const readLock = async (root: string): Promise<LockInfo | null> => {
  try {
    const raw = await readFile(lockPath(root), 'utf-8');
    const parsed = JSON.parse(raw);
    // Validate required fields
    if (typeof parsed.pid !== 'number' || typeof parsed.sessionId !== 'string' || typeof parsed.startTime !== 'string') {
      return null; // Malformed lock file — treat as absent
    }
    return parsed as LockInfo;
  } catch {
    return null;
  }
};

/**
 * Release the session lock.
 */
export const releaseLock = async (root: string): Promise<void> => {
  try {
    await unlink(lockPath(root));
  } catch {
    // Already gone
  }
};
