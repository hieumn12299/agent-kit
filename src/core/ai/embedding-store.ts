import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { getAgentPath } from '../../utils/file-system.js';
import type { AIProvider } from './ai-types.js';

const EMBEDDINGS_FILE = 'embeddings.json';

// ── Types ────────────────────────────────────────────────────────────

export interface EmbeddingEntry {
  embedding: number[];
  model: string;
  updatedAt: string;
  /** Hash of content to detect changes. */
  contentHash: string;
}

export type EmbeddingCache = Record<string, EmbeddingEntry>;

// ── Cosine Similarity ────────────────────────────────────────────────

/**
 * Compute cosine similarity between two vectors.
 * Returns value in [-1, 1] where 1 = identical direction.
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
};

// ── Simple Content Hash ──────────────────────────────────────────────

/**
 * Fast hash for content change detection (not cryptographic).
 */
export const contentHash = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const chr = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString(36);
};

// ── Embedding Store ──────────────────────────────────────────────────

const getEmbeddingsPath = (root: string): string =>
  join(getAgentPath(root), EMBEDDINGS_FILE);

/**
 * Load embedding cache from disk.
 */
export const loadEmbeddings = async (root: string): Promise<EmbeddingCache> => {
  try {
    const raw = await readFile(getEmbeddingsPath(root), 'utf-8');
    return JSON.parse(raw) as EmbeddingCache;
  } catch {
    return {};
  }
};

/**
 * Save embedding cache to disk.
 */
export const saveEmbeddings = async (root: string, cache: EmbeddingCache): Promise<void> => {
  const path = getEmbeddingsPath(root);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(cache), 'utf-8');
};

/**
 * Embed a single text and add to cache.
 * Skips if content hasn't changed.
 */
export const embedText = async (
  root: string,
  id: string,
  text: string,
  provider: AIProvider,
): Promise<EmbeddingEntry | null> => {
  const cache = await loadEmbeddings(root);
  const hash = contentHash(text);

  // Skip if already embedded with same content
  if (cache[id]?.contentHash === hash) {
    return cache[id];
  }

  const result = await provider.embed(text);
  if (result.embedding.length === 0) return null; // NoopProvider

  const entry: EmbeddingEntry = {
    embedding: result.embedding,
    model: result.model,
    updatedAt: new Date().toISOString(),
    contentHash: hash,
  };

  cache[id] = entry;
  await saveEmbeddings(root, cache);
  return entry;
};

/**
 * Remove an entry from the embedding cache.
 */
export const removeEmbedding = async (root: string, id: string): Promise<void> => {
  const cache = await loadEmbeddings(root);
  if (cache[id]) {
    delete cache[id];
    await saveEmbeddings(root, cache);
  }
};

/**
 * Get embedding for a cached memory ID.
 */
export const getEmbedding = async (root: string, id: string): Promise<number[] | null> => {
  const cache = await loadEmbeddings(root);
  return cache[id]?.embedding ?? null;
};
