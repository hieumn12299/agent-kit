import { writeFile, readFile, unlink, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getAgentPath } from '../../utils/file-system.js';
import { ok, err, type Result } from '../../types/result.js';

// ── Types ────────────────────────────────────────────────────────────

export interface LockInfo {
  agentId: string;
  resource: string;
  acquiredAt: string;
  expiresAt: string;
}

const LOCK_DIR = 'locks';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ── Helpers ──────────────────────────────────────────────────────────

const getLocksDir = (root: string): string =>
  join(getAgentPath(root), LOCK_DIR);

const lockFile = (root: string, resource: string): string =>
  join(getLocksDir(root), `${resource}.lock`);

const ensureLocksDir = async (root: string): Promise<void> => {
  await mkdir(getLocksDir(root), { recursive: true });
};

// ── Lock Operations ──────────────────────────────────────────────────

/**
 * Acquire an advisory lock on a resource.
 * Uses exclusive file create (wx flag) for atomicity.
 */
export const acquireLock = async (
  root: string,
  resource: string,
  agentId: string,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<Result<LockInfo, Error>> => {
  await ensureLocksDir(root);
  const path = lockFile(root, resource);

  // Check for existing lock (and auto-expire stale ones)
  const existing = await readLock(root, resource);
  if (existing) {
    if (isExpired(existing)) {
      // Stale lock — remove it
      await unlink(path).catch(() => {});
    } else {
      return err(new Error(
        `Resource '${resource}' is locked by '${existing.agentId}' until ${existing.expiresAt}. Retry later.`,
      ));
    }
  }

  const now = new Date();
  const lock: LockInfo = {
    agentId,
    resource,
    acquiredAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };

  try {
    await writeFile(path, JSON.stringify(lock, null, 2), { encoding: 'utf-8', flag: 'wx' });
    return ok(lock);
  } catch (e) {
    // EEXIST = race condition, another agent grabbed it first
    if ((e as NodeJS.ErrnoException).code === 'EEXIST') {
      return err(new Error(`Resource '${resource}' was locked by another agent (race condition). Retry later.`));
    }
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Release an advisory lock on a resource.
 * Only the owning agent can release.
 */
export const releaseLock = async (
  root: string,
  resource: string,
  agentId: string,
): Promise<Result<void, Error>> => {
  const existing = await readLock(root, resource);
  if (!existing) {
    return err(new Error(`No lock found for resource '${resource}'.`));
  }
  if (existing.agentId !== agentId) {
    return err(new Error(`Lock on '${resource}' is owned by '${existing.agentId}', not '${agentId}'.`));
  }

  try {
    await unlink(lockFile(root, resource));
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Force-release a lock regardless of owner.
 * Used by `agent lock release --force` or stale cleanup.
 */
export const forceReleaseLock = async (
  root: string,
  resource: string,
): Promise<Result<void, Error>> => {
  try {
    await unlink(lockFile(root, resource));
    return ok(undefined);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
      return ok(undefined); // Already gone
    }
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Check if a resource is currently locked.
 * Auto-expires stale locks.
 */
export const isLocked = async (
  root: string,
  resource: string,
): Promise<LockInfo | null> => {
  const lock = await readLock(root, resource);
  if (!lock) return null;

  if (isExpired(lock)) {
    // Auto-expire stale lock
    await unlink(lockFile(root, resource)).catch(() => {});
    return null;
  }

  return lock;
};

/**
 * List all active locks.
 */
export const listLocks = async (root: string): Promise<LockInfo[]> => {
  const dir = getLocksDir(root);
  let files: string[];
  try {
    files = await readdir(dir);
  } catch {
    return []; // No locks dir = no locks
  }

  const locks: LockInfo[] = [];
  for (const file of files) {
    if (!file.endsWith('.lock')) continue;
    const resource = file.replace('.lock', '');
    const lock = await isLocked(root, resource);
    if (lock) locks.push(lock);
  }

  return locks;
};

// ── Internal ─────────────────────────────────────────────────────────

const readLock = async (root: string, resource: string): Promise<LockInfo | null> => {
  try {
    const raw = await readFile(lockFile(root, resource), 'utf-8');
    return JSON.parse(raw) as LockInfo;
  } catch {
    return null;
  }
};

const isExpired = (lock: LockInfo): boolean =>
  new Date(lock.expiresAt).getTime() < Date.now();
