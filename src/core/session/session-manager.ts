import { randomBytes } from 'node:crypto';
import { ok, err, type Result } from '../../types/result.js';
import type { SessionMetadata } from '../../types/session.js';
import { writeSession, getActiveSession } from './session-store.js';
import { acquireLock, releaseLock, type LockInfo } from './session-lock.js';
import { getSubPath, WORKING_DIR } from '../../utils/file-system.js';
import { rm } from 'node:fs/promises';

/**
 * Generate a short unique session ID.
 */
const generateId = (): string => randomBytes(8).toString('hex');

export type OrphanedSession = {
  kind: 'orphaned';
  lockInfo: LockInfo;
  activeSession: SessionMetadata;
};

export type StartResult =
  | { kind: 'started'; session: SessionMetadata }
  | OrphanedSession;

/**
 * Start a new coding session.
 * Returns OrphanedSession if a previous session is still active (needs resolution).
 */
export const startSession = async (
  root: string,
): Promise<Result<StartResult, Error>> => {
  try {
    // Check for existing active session
    const activeResult = await getActiveSession(root);
    if (activeResult.ok && activeResult.value !== null) {
      const lockInfo: LockInfo = {
        pid: 0,
        sessionId: activeResult.value.sessionId,
        startTime: activeResult.value.startTime,
      };
      return ok({
        kind: 'orphaned',
        lockInfo,
        activeSession: activeResult.value,
      });
    }

    const sessionId = generateId();

    // Acquire lock
    const lockResult = await acquireLock(root, sessionId);
    if (!lockResult.ok) {
      // Another process holds the lock
      return ok({
        kind: 'orphaned',
        lockInfo: lockResult.error,
        activeSession: {
          sessionId: lockResult.error.sessionId,
          startTime: lockResult.error.startTime,
          isActive: true,
        },
      });
    }

    const session: SessionMetadata = {
      sessionId,
      startTime: new Date().toISOString(),
      isActive: true,
    };

    const writeResult = await writeSession(root, session);
    if (!writeResult.ok) {
      await releaseLock(root);
      return err(writeResult.error);
    }

    return ok({ kind: 'started', session });
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * End an existing session (mark inactive, release lock).
 */
export const endSession = async (
  root: string,
  session: SessionMetadata,
): Promise<Result<void, Error>> => {
  try {
    const ended: SessionMetadata = {
      ...session,
      isActive: false,
      endTime: new Date().toISOString(),
    };
    const writeResult = await writeSession(root, ended);
    if (!writeResult.ok) return writeResult;
    await releaseLock(root);

    // Clear working directory (NFR-SC2)
    try {
      const workingPath = getSubPath(root, WORKING_DIR);
      await rm(workingPath, { recursive: true, force: true });
      const { mkdir } = await import('node:fs/promises');
      await mkdir(workingPath, { recursive: true });
    } catch {
      // Working dir may not exist
    }

    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Force start: end previous session, release lock, then start new.
 */
export const forceStartSession = async (
  root: string,
  previousSession: SessionMetadata,
): Promise<Result<StartResult, Error>> => {
  const endResult = await endSession(root, previousSession);
  if (!endResult.ok) return endResult as unknown as Result<StartResult, Error>;
  return startSession(root);
};
