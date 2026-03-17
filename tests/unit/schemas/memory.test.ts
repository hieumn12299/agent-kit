import { describe, it, expect } from 'vitest';
import { MemoryEntrySchema } from '../../../src/schemas/memory.schema.js';

describe('MemoryEntrySchema', () => {
  const validEntry = {
    id: 'test-memory-id',
    title: 'Test Memory',
    type: 'insight',
    tier: 'project',
    source: 'session-1',
    timestamp: new Date().toISOString(),
    confidence: 0.9,
    tags: ['test'],
    content: 'This is test content',
  };

  it('validates a correct memory entry', () => {
    const result = MemoryEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it('fails with invalid id (not kebab-case)', () => {
    const invalidEntry = { ...validEntry, id: 'Test_Memory' };
    const result = MemoryEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('ID must be kebab-case');
    }
  });

  it('fails with invalid timestamp', () => {
    const invalidEntry = { ...validEntry, timestamp: 'invalid-date' };
    const result = MemoryEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });

  it('fails with invalid confidence range', () => {
    const invalidEntry = { ...validEntry, confidence: 1.5 };
    const result = MemoryEntrySchema.safeParse(invalidEntry);
    expect(result.success).toBe(false);
  });

  it('provides sensible defaults for confidence and tags', () => {
    const { confidence, tags, ...minimalEntry } = validEntry;
    const result = MemoryEntrySchema.safeParse(minimalEntry);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.confidence).toBe(1);
      expect(result.data.tags).toEqual([]);
    }
  });
});
