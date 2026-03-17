import { readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { ok, err, type Result } from '../../types/result.js';
import type { MemoryEntry, MemoryTier } from '../../types/memory.js';
import { getAgentPath } from '../../utils/file-system.js';
import { listMemories } from './memory-store.js';

// ── Types ────────────────────────────────────────────────────────────

export interface MemoryIndexEntry {
  id: string;
  title: string;
  type: string;
  tier: string;
  tags: string[];
  timestamp: string;
  confidence: number;
  source: string;
}

export interface MemoryIndex {
  version: number;
  updatedAt: string;
  entries: Record<string, MemoryIndexEntry>;
}

// ── Paths ────────────────────────────────────────────────────────────

const INDEX_FILE = 'index.json';
const INDEX_VERSION = 1;

const indexPath = (root: string): string =>
  join(getAgentPath(root), INDEX_FILE);

// ── Core Operations ──────────────────────────────────────────────────

const createEmptyIndex = (): MemoryIndex => ({
  version: INDEX_VERSION,
  updatedAt: new Date().toISOString(),
  entries: {},
});

const memoryToIndexEntry = (m: MemoryEntry): MemoryIndexEntry => ({
  id: m.id,
  title: m.title,
  type: m.type,
  tier: m.tier,
  tags: [...m.tags],
  timestamp: m.timestamp,
  confidence: m.confidence,
  source: m.source,
});

/**
 * Build a full index by scanning all memory files.
 */
export const buildIndex = async (root: string): Promise<MemoryIndex> => {
  const tiers: MemoryTier[] = ['project', 'working'];
  const index = createEmptyIndex();

  for (const tier of tiers) {
    const result = await listMemories(root, tier);
    if (result.ok) {
      for (const m of result.value) {
        index.entries[m.id] = memoryToIndexEntry(m);
      }
    }
  }

  return index;
};

/**
 * Load the index from disk. Returns error if missing or corrupt.
 */
export const loadIndex = async (root: string): Promise<Result<MemoryIndex, Error>> => {
  try {
    const raw = await readFile(indexPath(root), 'utf-8');
    const parsed = JSON.parse(raw) as MemoryIndex;
    if (!parsed.version || !parsed.entries) {
      return err(new Error('Invalid index format'));
    }
    return ok(parsed);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Save the index to disk (atomic write).
 */
export const saveIndex = async (root: string, index: MemoryIndex): Promise<Result<void, Error>> => {
  try {
    index.updatedAt = new Date().toISOString();
    const filePath = indexPath(root);
    const tmpPath = `${filePath}.tmp`;
    await writeFile(tmpPath, JSON.stringify(index, null, 2), 'utf-8');
    await rename(tmpPath, filePath);
    return ok(undefined);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Load or rebuild index. Transparent rebuild on corruption.
 */
export const ensureIndex = async (root: string): Promise<MemoryIndex> => {
  const loaded = await loadIndex(root);
  if (loaded.ok) return loaded.value;

  // Rebuild from files
  const index = await buildIndex(root);
  await saveIndex(root, index);
  return index;
};

/**
 * Add or update a single entry in the index.
 */
export const updateIndexEntry = async (root: string, memory: MemoryEntry): Promise<void> => {
  const index = await ensureIndex(root);
  index.entries[memory.id] = memoryToIndexEntry(memory);
  await saveIndex(root, index);
};

/**
 * Remove a single entry from the index.
 */
export const removeIndexEntry = async (root: string, id: string): Promise<void> => {
  const loaded = await loadIndex(root);
  if (!loaded.ok) return; // No index to update
  const index = loaded.value;
  delete index.entries[id];
  await saveIndex(root, index);
};

/**
 * Validate index integrity against actual files.
 * Returns list of issues found.
 */
export const validateIndex = async (root: string): Promise<{
  missingInIndex: string[];
  orphanedInIndex: string[];
  stale: string[];
}> => {
  const index = await ensureIndex(root);
  const tiers: MemoryTier[] = ['project', 'working'];
  const fileMemoryIds = new Set<string>();
  const fileMemories = new Map<string, MemoryEntry>();

  for (const tier of tiers) {
    const result = await listMemories(root, tier);
    if (result.ok) {
      for (const m of result.value) {
        fileMemoryIds.add(m.id);
        fileMemories.set(m.id, m);
      }
    }
  }

  const indexIds = new Set(Object.keys(index.entries));

  // Files not in index
  const missingInIndex = [...fileMemoryIds].filter(id => !indexIds.has(id));

  // Index entries with no file
  const orphanedInIndex = [...indexIds].filter(id => !fileMemoryIds.has(id));

  // Index entries with stale data (timestamp mismatch)
  const stale = [...indexIds]
    .filter(id => fileMemories.has(id))
    .filter(id => {
      const file = fileMemories.get(id)!;
      const indexed = index.entries[id];
      return file.timestamp !== indexed.timestamp || file.title !== indexed.title;
    });

  return { missingInIndex, orphanedInIndex, stale };
};
