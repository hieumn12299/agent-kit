import { acquireLock, releaseLock } from './lock-manager.js';
import { writeMemory } from '../memory/memory-store.js';
import { ok, err, type Result } from '../../types/result.js';
import type { MemoryEntry } from '../../types/memory.js';

const MEMORY_WRITE_RESOURCE = 'memory-write';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;

/**
 * Write a memory with advisory lock coordination.
 * Acquires lock → writes → releases. Retries on contention.
 */
export const coordinatedWrite = async (
  root: string,
  entry: MemoryEntry,
  agentId: string,
): Promise<Result<void, Error>> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    // Acquire lock
    const lockResult = await acquireLock(root, MEMORY_WRITE_RESOURCE, agentId);

    if (!lockResult.ok) {
      lastError = lockResult.error;
      // Exponential backoff
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
      continue;
    }

    try {
      // Write memory
      const writeResult = await writeMemory(root, entry);
      if (!writeResult.ok) {
        return writeResult;
      }
      return ok(undefined);
    } finally {
      // Always release lock
      await releaseLock(root, MEMORY_WRITE_RESOURCE, agentId).catch(() => {});
    }
  }

  return err(lastError ?? new Error('Failed to acquire lock after retries'));
};

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));
