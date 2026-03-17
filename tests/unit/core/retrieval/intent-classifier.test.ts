import { describe, it, expect } from 'vitest';
import { classifyIntent, getIntentFilter } from '../../../../src/core/retrieval/intent-classifier.js';

describe('intent-classifier', () => {
  describe('classifyIntent', () => {
    it('classifies architecture queries', () => {
      const result = classifyIntent('how do we handle auth architecture?');
      expect(result.intent).toBe('architecture');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.matchedKeywords).toContain('architecture');
    });

    it('classifies debugging queries', () => {
      const result = classifyIntent("what's the bug in payment?");
      expect(result.intent).toBe('debugging');
      expect(result.matchedKeywords).toContain('bug');
    });

    it('classifies onboarding queries', () => {
      const result = classifyIntent('how to setup this project?');
      expect(result.intent).toBe('onboarding');
      expect(result.matchedKeywords).toContain('setup');
    });

    it('classifies implementation queries', () => {
      const result = classifyIntent('how to implement user auth?');
      expect(result.intent).toBe('implementation');
      expect(result.matchedKeywords).toContain('implement');
    });

    it('classifies review queries', () => {
      const result = classifyIntent('review the test quality');
      expect(result.intent).toBe('review');
      expect(result.matchedKeywords).toContain('review');
    });

    it('returns general for unrecognizable queries', () => {
      const result = classifyIntent('hello world');
      expect(result.intent).toBe('general');
      expect(result.confidence).toBe(0);
      expect(result.matchedKeywords).toHaveLength(0);
    });

    it('returns general for empty query', () => {
      const result = classifyIntent('');
      expect(result.intent).toBe('general');
    });

    it('picks highest scoring intent when multiple match', () => {
      // "debug the design pattern" matches both debugging and architecture
      const result = classifyIntent('debug the design pattern structure');
      // architecture has 2 matches (design, pattern, structure) vs debugging has 1 (debug)
      expect(result.intent).toBe('architecture');
    });
  });

  describe('getIntentFilter', () => {
    it('returns filter for known intents', () => {
      const filter = getIntentFilter('architecture');
      expect(filter).toBeDefined();
      expect(filter!.types).toContain('decision');
      expect(filter!.types).toContain('pattern');
    });

    it('returns null for general intent', () => {
      expect(getIntentFilter('general')).toBeNull();
    });

    it('debugging filter prioritizes bug-learning type', () => {
      const filter = getIntentFilter('debugging');
      expect(filter!.types).toContain('bug-learning');
    });

    it('each filter has tierPriority', () => {
      for (const intent of ['architecture', 'debugging', 'onboarding', 'implementation', 'review'] as const) {
        const filter = getIntentFilter(intent);
        expect(filter!.tierPriority.length).toBeGreaterThan(0);
      }
    });
  });
});
