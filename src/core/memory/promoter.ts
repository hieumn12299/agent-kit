import type { MemoryEntry, MemoryTier } from '../../types/memory.js';
import type { Insight } from '../session/insight-extractor.js';
import { toSlug, writeMemory, deleteMemory, readMemory } from '../memory/memory-store.js';
import { ok, err, type Result } from '../../types/result.js';

/**
 * Convert an insight into a MemoryEntry ready for storage.
 * Uses kebab-case slug from insight summary as the ID.
 */
export const promoteInsight = (
  insight: Insight,
  sessionId: string,
  index: number,
): MemoryEntry => {
  const timestamp = new Date().toISOString();
  const baseSlug = toSlug(insight.summary);
  const id = baseSlug ? `${baseSlug}-${index}` : `insight-${sessionId.slice(0, 8)}-${index}`;

  return {
    id,
    title: insight.summary,
    type: 'insight',
    tier: 'project',
    source: `session:${sessionId}`,
    timestamp,
    confidence: 0.8,
    tags: ['auto-extracted'],
    content: `[${insight.source}] ${insight.summary}`,
  };
};

/**
 * Batch promote all insights into MemoryEntry objects.
 */
export const promoteAll = (
  insights: Insight[],
  sessionId: string,
): MemoryEntry[] =>
  insights.map((insight, i) => promoteInsight(insight, sessionId, i));

// ── Tier Promotion ───────────────────────────────────────────────────

const PROMOTION_PATH: Record<string, MemoryTier> = {
  working: 'project',
  project: 'knowledge',
};

/**
 * Get the default promotion target for a tier.
 * working → project, project → knowledge.
 */
export const getDefaultPromotionTarget = (fromTier: MemoryTier): MemoryTier | null =>
  PROMOTION_PATH[fromTier] ?? null;

/**
 * Promote a memory from one tier to another.
 * Copies the memory with updated tier/source, then deletes from source.
 */
export const promoteMemory = async (
  root: string,
  id: string,
  fromTier: MemoryTier,
  toTier: MemoryTier,
): Promise<Result<MemoryEntry, Error>> => {
  // Read source memory
  const readResult = await readMemory(root, id, fromTier);
  if (!readResult.ok) return err(new Error(`Memory '${id}' not found in ${fromTier} tier`));

  const source = readResult.value;

  // Check for ID conflict in target tier and resolve
  let promotedId = id;
  const conflict = await readMemory(root, id, toTier);
  if (conflict.ok) {
    // ID exists in target — append suffix
    promotedId = `${id}-promoted`;
    let n = 2;
    while ((await readMemory(root, promotedId, toTier)).ok && n <= 10) {
      promotedId = `${id}-promoted-${n}`;
      n++;
    }
  }

  // Build promoted entry
  const promoted: MemoryEntry = {
    ...source,
    id: promotedId,
    tier: toTier,
    source: `promoted:from-${fromTier}`,
  };

  // Write to target tier
  const writeResult = await writeMemory(root, promoted);
  if (!writeResult.ok) return err(writeResult.error);

  // Delete from source tier
  const delResult = await deleteMemory(root, id, fromTier);
  if (!delResult.ok) {
    // Rollback: delete from target if source delete failed
    await deleteMemory(root, promotedId, toTier).catch(() => {});
    return err(new Error(`Promotion failed: could not delete from ${fromTier}`));
  }

  return ok(promoted);
};
