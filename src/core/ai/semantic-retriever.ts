import type { AIProvider } from './ai-types.js';
import type { MemoryEntry } from '../../types/memory.js';
import type { ScoredMemory } from '../retrieval/retrieval-engine.js';
import { cosineSimilarity, loadEmbeddings, embedText } from './embedding-store.js';

/**
 * Semantic search — embed query, compare against cached memory embeddings.
 * Returns memories ranked by cosine similarity.
 *
 * Falls back gracefully:
 * - No AI provider → empty results
 * - No cached embeddings → empty results
 * - Errors → empty results (never throws)
 */
export const semanticSearch = async (
  root: string,
  query: string,
  memories: MemoryEntry[],
  provider: AIProvider,
  options?: { topK?: number; minScore?: number },
): Promise<ScoredMemory[]> => {
  const topK = options?.topK ?? 10;
  const minScore = options?.minScore ?? 0.3;

  try {
    // Embed query
    const queryResult = await provider.embed(query);
    if (queryResult.embedding.length === 0) return [];

    // Load cached embeddings
    const cache = await loadEmbeddings(root);

    // Score each memory
    const scored: ScoredMemory[] = [];

    for (const memory of memories) {
      const cached = cache[memory.id];
      if (!cached?.embedding?.length) continue;

      const score = cosineSimilarity(queryResult.embedding, cached.embedding);
      if (score >= minScore) {
        scored.push({ memory, score });
      }
    }

    // Sort by score descending, take topK
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  } catch {
    return []; // Graceful degradation
  }
};

/**
 * Auto-embed a memory on creation (if AI configured).
 * Call after createMemory — fire-and-forget pattern.
 */
export const autoEmbed = async (
  root: string,
  memory: MemoryEntry,
  provider: AIProvider,
): Promise<void> => {
  const text = `${memory.title}\n${memory.content}`;
  await embedText(root, memory.id, text, provider);
};
