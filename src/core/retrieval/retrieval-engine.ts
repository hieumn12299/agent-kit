import type { MemoryEntry } from '../../types/memory.js';

export interface ScoredMemory {
  memory: MemoryEntry;
  score: number;
}

/**
 * Scoring algorithm (documented per FR requirement):
 *
 * score = (keywordMatches / totalWords) * recencyDecay(daysSinceCreation)
 *
 * Where:
 *   keywordMatches = number of query keywords found in title + content (case-insensitive)
 *   totalWords     = total words in the query
 *   recencyDecay   = 1 / (1 + daysSinceCreation * 0.05)
 *       Fresh memories (0 days) → decay = 1.0
 *       1 week old              → decay ≈ 0.74
 *       30 days old             → decay ≈ 0.4
 *       365 days old            → decay ≈ 0.05
 */

const recencyDecay = (timestamp: string): number => {
  const days = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / (1000 * 60 * 60 * 24));
  return 1 / (1 + days * 0.05);
};

const countKeywordMatches = (text: string, keywords: string[]): number => {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
};

/**
 * Score a memory against a query.
 */
export const scoreMemory = (memory: MemoryEntry, query: string): number => {
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 1);

  if (keywords.length === 0) return 0;

  const searchText = `${memory.title} ${memory.content} ${memory.id} ${memory.tags.join(' ')}`;
  const matches = countKeywordMatches(searchText, keywords);
  const relevance = matches / keywords.length;
  const decay = recencyDecay(memory.timestamp);

  return relevance * decay;
};

/**
 * Search memories by query, returning scored and sorted results.
 * Only returns memories with score > 0.
 */
export const searchMemories = (
  memories: MemoryEntry[],
  query: string,
): ScoredMemory[] => {
  const scored = memories
    .map((memory) => ({ memory, score: scoreMemory(memory, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored;
};

/**
 * Format a scored memory for UX-DR7 output:
 * ## [score] Title
 * *tier · timestamp*
 * body
 */
export const formatScoredMemory = (sm: ScoredMemory): string => {
  const score = (sm.score * 100).toFixed(0);
  const date = sm.memory.timestamp.slice(0, 10);
  return [
    `## [${score}%] ${sm.memory.title}`,
    `*${sm.memory.tier} · ${date}*`,
    '',
    sm.memory.content,
  ].join('\n');
};
