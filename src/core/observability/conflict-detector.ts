import type { MemoryEntry } from '../../types/memory.js';
import { listAllMemories } from '../memory/memory-store.js';

// ── Types ────────────────────────────────────────────────────────────

export interface ConflictResult {
  type: 'duplicate' | 'similar';
  memoryA: { id: string; tier: string; title: string };
  memoryB: { id: string; tier: string; title: string };
  suggestion: string;
}

// ── Detection ────────────────────────────────────────────────────────

// Uses shared listAllMemories from memory-store.ts

/**
 * Compute Jaccard similarity between two tag sets (0–1).
 */
const tagSimilarity = (tagsA: string[], tagsB: string[]): number => {
  if (tagsA.length === 0 && tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

const memRef = (m: MemoryEntry) => ({ id: m.id, tier: m.tier, title: m.title });

/**
 * Find duplicate memories: same title or same ID across different tiers.
 */
const findDuplicates = (memories: MemoryEntry[]): ConflictResult[] => {
  const conflicts: ConflictResult[] = [];
  const seen = new Map<string, MemoryEntry>();

  for (const m of memories) {
    // Check by title (case-insensitive)
    const titleKey = m.title.toLowerCase();
    const existing = seen.get(titleKey);
    if (existing && existing.tier !== m.tier) {
      conflicts.push({
        type: 'duplicate',
        memoryA: memRef(existing),
        memoryB: memRef(m),
        suggestion: `Same title "${m.title}" in ${existing.tier} and ${m.tier} — consider merging`,
      });
    }
    if (!seen.has(titleKey)) {
      seen.set(titleKey, m);
    }
  }

  return conflicts;
};

/**
 * Find similar memories: >50% tag overlap between memories in different tiers.
 */
const findSimilar = (memories: MemoryEntry[]): ConflictResult[] => {
  const conflicts: ConflictResult[] = [];
  const SIMILARITY_THRESHOLD = 0.5;

  // Only compare cross-tier pairs to avoid noise
  for (let i = 0; i < memories.length; i++) {
    for (let j = i + 1; j < memories.length; j++) {
      const a = memories[i];
      const b = memories[j];
      if (a.tier === b.tier) continue;
      if (a.tags.length === 0 || b.tags.length === 0) continue;

      const similarity = tagSimilarity(a.tags, b.tags);
      if (similarity >= SIMILARITY_THRESHOLD) {
        conflicts.push({
          type: 'similar',
          memoryA: memRef(a),
          memoryB: memRef(b),
          suggestion: `"${a.title}" and "${b.title}" share ${Math.round(similarity * 100)}% tags — consider merging`,
        });
      }
    }
  }

  return conflicts;
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Detect all conflicts: duplicates + similar memories across tiers.
 */
export const detectConflicts = async (root: string): Promise<ConflictResult[]> => {
  const memories = await listAllMemories(root);
  const duplicates = findDuplicates(memories);
  const similar = findSimilar(memories);

  // Deduplicate: if a pair is both duplicate AND similar, keep only duplicate
  const duplicatePairs = new Set(
    duplicates.map(d => `${d.memoryA.id}:${d.memoryB.id}`),
  );
  const uniqueSimilar = similar.filter(
    s => !duplicatePairs.has(`${s.memoryA.id}:${s.memoryB.id}`),
  );

  return [...duplicates, ...uniqueSimilar];
};
