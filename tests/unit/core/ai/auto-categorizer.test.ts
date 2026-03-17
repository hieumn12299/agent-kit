import { describe, it, expect } from 'vitest';
import { suggestCategory } from '../../../../src/core/ai/auto-categorizer.js';
import { NoopProvider } from '../../../../src/core/ai/ai-provider.js';
import type { AIProvider, EmbeddingResult, CompletionResult } from '../../../../src/core/ai/ai-types.js';

// Mock provider that returns predictable completions
class MockCompletionProvider implements AIProvider {
  readonly name = 'mock';
  private response: string;

  constructor(response: string) {
    this.response = response;
  }

  async embed(): Promise<EmbeddingResult> {
    return { embedding: [], model: 'mock' };
  }

  async complete(): Promise<CompletionResult> {
    return { text: this.response, model: 'mock' };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

class UnavailableProvider implements AIProvider {
  readonly name = 'unavailable';
  async embed(): Promise<EmbeddingResult> { return { embedding: [], model: 'none' }; }
  async complete(): Promise<CompletionResult> { return { text: '', model: 'none' }; }
  async isAvailable(): Promise<boolean> { return false; }
}

describe('Auto-categorizer', () => {
  it('parses valid JSON response', async () => {
    const provider = new MockCompletionProvider(
      '{"type": "decision", "tags": ["auth", "security"], "confidence": 0.95}',
    );

    const result = await suggestCategory('Use JWT tokens', 'For API auth', provider);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('decision');
    expect(result!.tags).toEqual(['auth', 'security']);
    expect(result!.confidence).toBe(0.95);
  });

  it('handles markdown-wrapped JSON', async () => {
    const provider = new MockCompletionProvider(
      '```json\n{"type": "pattern", "tags": ["react"], "confidence": 0.8}\n```',
    );

    const result = await suggestCategory('React hooks', 'Custom hooks', provider);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('pattern');
  });

  it('falls back to regex extraction', async () => {
    const provider = new MockCompletionProvider(
      'The type is "integration" and tags are ["backend", "api"]',
    );

    const result = await suggestCategory('API design', 'REST patterns', provider);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('integration');
    expect(result!.confidence).toBe(0.6); // Regex fallback confidence
  });

  it('validates type against allowed types', async () => {
    const provider = new MockCompletionProvider(
      '{"type": "invalid_type", "tags": ["test"], "confidence": 0.9}',
    );

    const result = await suggestCategory('Test', 'content', provider);
    expect(result).not.toBeNull();
    expect(result!.type).toBe('insight'); // Falls back to 'insight'
  });

  it('returns null for NoopProvider', async () => {
    const noop = new NoopProvider();
    const result = await suggestCategory('Test', 'content', noop);
    expect(result).toBeNull(); // Empty completion text → null
  });

  it('returns null for unavailable provider', async () => {
    const provider = new UnavailableProvider();
    const result = await suggestCategory('Test', 'content', provider);
    expect(result).toBeNull();
  });

  it('limits tags to 5', async () => {
    const provider = new MockCompletionProvider(
      '{"type": "insight", "tags": ["a", "b", "c", "d", "e", "f", "g"], "confidence": 0.8}',
    );

    const result = await suggestCategory('Test', 'content', provider);
    expect(result!.tags.length).toBeLessThanOrEqual(5);
  });
});
