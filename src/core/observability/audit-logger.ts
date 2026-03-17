import { appendFile, stat, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { getSubPath } from '../../utils/file-system.js';

const LOG_FILE = 'audit.log';
const MAX_SIZE = 1_000_000; // 1MB rotation threshold

const logPath = (root: string): string =>
  join(getSubPath(root, ''), LOG_FILE);

/**
 * Append an entry to the audit log.
 * Format: [ISO-8601] OP target RESULT (grep-friendly)
 */
export const auditLog = async (
  root: string,
  op: string,
  target: string,
  result: 'OK' | 'FAIL',
): Promise<void> => {
  try {
    const path = logPath(root);
    const entry = `[${new Date().toISOString()}] ${op} ${target} ${result}\n`;

    // Append first — data safety over size precision
    await appendFile(path, entry, 'utf-8');

    // Rotation check — after append so no entries are ever lost
    try {
      const stats = await stat(path);
      if (stats.size >= MAX_SIZE) {
        await rename(path, `${path}.old`);
      }
    } catch {
      // File stat/rename failed — next append will retry rotation
    }
  } catch {
    // Audit logging should never crash the app
  }
};

/**
 * Read audit log size.
 */
export const auditLogSize = async (root: string): Promise<number> => {
  try {
    const stats = await stat(logPath(root));
    return stats.size;
  } catch {
    return 0;
  }
};
