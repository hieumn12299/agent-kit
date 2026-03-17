import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '../../types/result.js';
import type { SessionMetadata } from '../../types/session.js';
import { SessionMetadataSchema } from '../../schemas/session.schema.js';
import { getSubPath, SESSIONS_DIR } from '../../utils/file-system.js';

const sessionsPath = (root: string): string => getSubPath(root, SESSIONS_DIR);
const sessionFile = (root: string, id: string): string =>
  join(sessionsPath(root), `${id}.json`);

/**
 * Write a session file atomically (write .tmp → rename).
 */
export const writeSession = async (
  root: string,
  session: SessionMetadata,
): Promise<Result<void, Error>> => {
  try {
    const target = sessionFile(root, session.sessionId);
    const tmp = `${target}.tmp`;
    await writeFile(tmp, JSON.stringify(session, null, 2), 'utf-8');
    await rename(tmp, target);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Read a single session by ID.
 */
export const readSession = async (
  root: string,
  id: string,
): Promise<Result<SessionMetadata, Error>> => {
  try {
    const raw = await readFile(sessionFile(root, id), 'utf-8');
    const parsed = SessionMetadataSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return err(new Error(`Invalid session data: ${parsed.error.message}`));
    }
    return ok(parsed.data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * List all sessions.
 */
export const listSessions = async (
  root: string,
): Promise<Result<SessionMetadata[], Error>> => {
  try {
    const dir = sessionsPath(root);
    let files: string[];
    try {
      files = await readdir(dir);
    } catch {
      return ok([]);
    }

    const sessions: SessionMetadata[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const id = file.replace('.json', '');
      const result = await readSession(root, id);
      if (result.ok) sessions.push(result.value);
    }

    return ok(sessions);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Get the currently active session, if any.
 */
export const getActiveSession = async (
  root: string,
): Promise<Result<SessionMetadata | null, Error>> => {
  const result = await listSessions(root);
  if (!result.ok) return err(result.error);
  const active = result.value.find((s) => s.isActive);
  return ok(active ?? null);
};
