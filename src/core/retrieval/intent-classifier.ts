import type { MemoryType, MemoryTier } from '../../types/memory.js';

// ── Intent Types ─────────────────────────────────────────────────────

export type Intent =
  | 'architecture'
  | 'debugging'
  | 'onboarding'
  | 'implementation'
  | 'review'
  | 'general';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  matchedKeywords: string[];
}

export interface IntentFilter {
  types: MemoryType[];
  tags: string[];
  tierPriority: MemoryTier[];
}

// ── Keyword Patterns ─────────────────────────────────────────────────

const INTENT_PATTERNS: Record<Exclude<Intent, 'general'>, string[]> = {
  architecture: ['architecture', 'design', 'pattern', 'structure', 'stack', 'system', 'schema', 'diagram'],
  debugging: ['bug', 'error', 'fix', 'crash', 'issue', 'broken', 'fail', 'wrong', 'debug'],
  onboarding: ['setup', 'install', 'getting started', 'overview', 'what is', 'how does', 'introduction', 'new to'],
  implementation: ['how to', 'implement', 'create', 'build', 'add', 'make', 'code', 'write'],
  review: ['review', 'check', 'validate', 'test', 'quality', 'coverage', 'audit'],
};

const INTENT_FILTERS: Record<Exclude<Intent, 'general'>, IntentFilter> = {
  architecture: {
    types: ['decision', 'pattern', 'convention'],
    tags: ['arch', 'design', 'architecture', 'pattern', 'structure'],
    tierPriority: ['project', 'knowledge', 'working'],
  },
  debugging: {
    types: ['bug-learning', 'insight'],
    tags: ['bug', 'fix', 'error', 'debug'],
    tierPriority: ['working', 'project', 'knowledge'],
  },
  onboarding: {
    types: ['decision', 'pattern', 'insight', 'convention'],
    tags: [],
    tierPriority: ['project', 'knowledge', 'working'],
  },
  implementation: {
    types: ['pattern', 'insight', 'convention'],
    tags: ['code', 'impl', 'implementation', 'how-to'],
    tierPriority: ['working', 'project', 'knowledge'],
  },
  review: {
    types: ['decision', 'pattern', 'convention'],
    tags: ['quality', 'review', 'test', 'standard'],
    tierPriority: ['project', 'knowledge', 'working'],
  },
};

// ── Classification ───────────────────────────────────────────────────

/**
 * Classify query intent using keyword matching.
 * Returns the best-matching intent with confidence score.
 */
export const classifyIntent = (query: string): IntentResult => {
  const lower = query.toLowerCase();
  let bestIntent: Intent = 'general';
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const [intent, keywords] of Object.entries(INTENT_PATTERNS)) {
    const matched = keywords.filter(kw => lower.includes(kw));
    const score = matched.length / keywords.length;

    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as Intent;
      bestMatches = matched;
    }
  }

  // Require at least one keyword match
  if (bestMatches.length === 0) {
    return { intent: 'general', confidence: 0, matchedKeywords: [] };
  }

  return {
    intent: bestIntent,
    confidence: Math.min(bestScore * 2, 1), // Scale up, cap at 1
    matchedKeywords: bestMatches,
  };
};

/**
 * Get the filter for a classified intent.
 * Returns null for 'general' intent (use full scan).
 */
export const getIntentFilter = (intent: Intent): IntentFilter | null => {
  if (intent === 'general') return null;
  return INTENT_FILTERS[intent];
};
