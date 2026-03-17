import type { AIProvider } from './ai-types.js';
import type { MemoryType } from '../../types/memory.js';

// ── Types ────────────────────────────────────────────────────────────

export interface CategorizationResult {
  type: MemoryType;
  tags: string[];
  confidence: number;
}

const VALID_TYPES: MemoryType[] = [
  'insight', 'decision', 'pattern', 'convention',
  'bug-learning', 'integration', 'preference',
];

const SYSTEM_PROMPT = `You are a memory categorizer for a developer knowledge base.
Given a memory title and content, suggest the most appropriate type and tags.

Valid types: ${VALID_TYPES.join(', ')}

Respond ONLY with JSON (no markdown, no explanation):
{"type": "insight", "tags": ["auth", "security"], "confidence": 0.9}

Rules:
- type must be one of the valid types
- tags should be 1-5 lowercase keywords
- confidence should be 0.0-1.0 based on how certain you are`;

/**
 * Use LLM to suggest category (type + tags) for a memory.
 * Returns null if AI unavailable or parsing fails.
 */
export const suggestCategory = async (
  title: string,
  content: string,
  provider: AIProvider,
): Promise<CategorizationResult | null> => {
  try {
    const available = await provider.isAvailable();
    if (!available) return null;

    const prompt = `Title: ${title}\nContent: ${content}`;
    const result = await provider.complete(prompt, {
      system: SYSTEM_PROMPT,
      maxTokens: 100,
      temperature: 0.2,
    });

    if (!result.text) return null;

    // Parse JSON response (with fallback to regex)
    return parseCategorizationResponse(result.text);
  } catch {
    return null;
  }
};

/**
 * Parse LLM response into CategorizationResult.
 * Tries JSON first, falls back to regex extraction.
 */
const parseCategorizationResponse = (text: string): CategorizationResult | null => {
  // Try JSON parse
  try {
    // Extract JSON from potential markdown wrapping
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
      const type = String(parsed.type || 'insight');
      const tags = Array.isArray(parsed.tags) ? parsed.tags.map(String) : [];
      const confidence = Number(parsed.confidence) || 0.7;

      // Validate type
      const validType = VALID_TYPES.includes(type as MemoryType)
        ? (type as MemoryType)
        : 'insight';

      return { type: validType, tags: tags.slice(0, 5), confidence };
    }
  } catch {
    // Fall through to regex
  }

  // Regex fallback
  const typeMatch = text.match(/type[\s]*[:=]\s*["']?(\w[\w-]*)["']?/i)
    ?? text.match(/["']type["']\s*[:=]\s*["']?(\w[\w-]*)["']?/i)
    ?? text.match(/type\s+(?:is\s+)?["'](\w[\w-]*)["']/i);
  const tagsMatch = text.match(/tags[\s]*[:=]\s*\[([^\]]*)\]/i);

  if (typeMatch) {
    const type = typeMatch[1].toLowerCase();
    const validType = VALID_TYPES.includes(type as MemoryType)
      ? (type as MemoryType)
      : 'insight';

    const tags = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim().replace(/["']/g, '').toLowerCase()).filter(Boolean)
      : [];

    return { type: validType, tags: tags.slice(0, 5), confidence: 0.6 };
  }

  return null;
};
