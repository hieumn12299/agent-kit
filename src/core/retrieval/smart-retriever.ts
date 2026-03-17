import type { MemoryEntry, MemoryTier, MemoryType } from '../../types/memory.js';
import { ensureIndex } from '../memory/memory-index.js';
import { readMemory, listMemories } from '../memory/memory-store.js';
import { classifyIntent, getIntentFilter } from './intent-classifier.js';
import { searchMemories, type ScoredMemory } from './retrieval-engine.js';
import { semanticSearch } from '../ai/semantic-retriever.js';
import { getAIProvider } from '../ai/ai-config.js';
import { isAIConfigured } from '../ai/ai-config.js';

// ── Types ────────────────────────────────────────────────────────────

export interface SmartRetrievalResult {
  memories: ScoredMemory[];
  intent: string;
  confidence: number;
  filterApplied: boolean;
  matchedKeywords: string[];
}

// ── Smart Retrieval ──────────────────────────────────────────────────

/**
 * Intent-aware retrieval pipeline:
 * 1. Classify query intent
 * 2. If intent detected → filter memories by type/tags using index
 * 3. Score filtered memories against query
 * 4. If no intent → fallback to full search
 */
export const smartRetrieve = async (
  root: string,
  query: string,
  options?: { limit?: number },
): Promise<SmartRetrievalResult> => {
  const limit = options?.limit ?? 10;
  const intentResult = classifyIntent(query);
  const filter = getIntentFilter(intentResult.intent);

  // No intent detected → full scan fallback
  if (!filter) {
    const allMemories = await gatherAllMemories(root);
    const keywordResults = searchMemories(allMemories, query).slice(0, limit);

    // Try semantic search if AI configured
    const semanticResults = await trySemanticSearch(root, query, allMemories);
    const merged = mergeResults(semanticResults, keywordResults, limit);

    return {
      memories: merged,
      intent: 'general',
      confidence: 0,
      filterApplied: false,
      matchedKeywords: [],
    };
  }

  // Use index for fast filtering
  const index = await ensureIndex(root);
  const entries = Object.values(index.entries);

  // Filter by type and tags
  const matchingIds = entries
    .filter(entry => {
      const typeMatch = filter.types.length === 0 || filter.types.includes(entry.type as MemoryType);
      const tagMatch = filter.tags.length === 0 ||
        entry.tags.some(t => filter.tags.includes(t.toLowerCase()));
      return typeMatch || tagMatch;
    })
    .map(e => ({ id: e.id, tier: e.tier as MemoryTier }));

  // Read full memories for matched entries
  const memories: MemoryEntry[] = [];
  for (const { id, tier } of matchingIds) {
    const result = await readMemory(root, id, tier);
    if (result.ok) memories.push(result.value);
  }

  // Also include knowledge memories if in tier priority
  if (filter.tierPriority.includes('knowledge')) {
    const knowledgeResult = await listMemories(root, 'knowledge');
    if (knowledgeResult.ok) {
      const knowledgeFiltered = knowledgeResult.value.filter(m => {
        const typeMatch = filter.types.length === 0 || filter.types.includes(m.type);
        const tagMatch = filter.tags.length === 0 ||
          m.tags.some(t => filter.tags.includes(t.toLowerCase()));
        return typeMatch || tagMatch;
      });
      // Add knowledge memories not already included
      const existingIds = new Set(memories.map(m => m.id));
      for (const km of knowledgeFiltered) {
        if (!existingIds.has(km.id)) memories.push(km);
      }
    }
  }

  // Score and rank
  const scored = searchMemories(memories, query).slice(0, limit);

  // If filtered search returned nothing, fallback to full scan
  if (scored.length === 0) {
    const allMemories = await gatherAllMemories(root);
    const keywordResults = searchMemories(allMemories, query).slice(0, limit);
    const semanticResults = await trySemanticSearch(root, query, allMemories);
    const merged = mergeResults(semanticResults, keywordResults, limit);
    return {
      memories: merged,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      filterApplied: false,
      matchedKeywords: intentResult.matchedKeywords,
    };
  }

  // Sort by tier priority
  const tierOrder = new Map(filter.tierPriority.map((t, i) => [t, i]));
  scored.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (Math.abs(scoreDiff) > 0.1) return scoreDiff;
    const tierA = tierOrder.get(a.memory.tier) ?? 99;
    const tierB = tierOrder.get(b.memory.tier) ?? 99;
    return tierA - tierB;
  });

  return {
    memories: scored,
    intent: intentResult.intent,
    confidence: intentResult.confidence,
    filterApplied: true,
    matchedKeywords: intentResult.matchedKeywords,
  };
};

// ── Helpers ──────────────────────────────────────────────────────────

const gatherAllMemories = async (root: string): Promise<MemoryEntry[]> => {
  const tiers: MemoryTier[] = ['project', 'working', 'knowledge'];
  const all: MemoryEntry[] = [];
  for (const tier of tiers) {
    const result = await listMemories(root, tier);
    if (result.ok) all.push(...result.value);
  }
  return all;
};

/**
 * Try semantic search if AI is configured.
 * Returns empty array if not configured or on error.
 */
const trySemanticSearch = async (
  root: string,
  query: string,
  memories: MemoryEntry[],
): Promise<ScoredMemory[]> => {
  try {
    if (!(await isAIConfigured(root))) return [];
    const provider = await getAIProvider(root);
    return await semanticSearch(root, query, memories, provider);
  } catch {
    return [];
  }
};

/**
 * Merge semantic and keyword results, deduplicating by ID.
 * Semantic results get priority (listed first).
 */
const mergeResults = (
  semantic: ScoredMemory[],
  keyword: ScoredMemory[],
  limit: number,
): ScoredMemory[] => {
  const seen = new Set<string>();
  const merged: ScoredMemory[] = [];

  // Semantic first (higher quality)
  for (const r of semantic) {
    if (!seen.has(r.memory.id)) {
      seen.add(r.memory.id);
      merged.push(r);
    }
  }

  // Then keyword fills gaps
  for (const r of keyword) {
    if (!seen.has(r.memory.id)) {
      seen.add(r.memory.id);
      merged.push(r);
    }
  }

  return merged.slice(0, limit);
};
