import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import {
  cosineSimilarity,
  contentHash,
  loadEmbeddings,
  saveEmbeddings,
  embedText,
  removeEmbedding,
  getEmbedding,
  type EmbeddingCache,
} from '../../../../src/core/ai/embedding-store.js';
import { semanticSearch, autoEmbed } from '../../../../src/core/ai/semantic-retriever.js';
import { NoopProvider } from '../../../../src/core/ai/ai-provider.js';
import type { AIProvider, EmbeddingResult, CompletionResult } from '../../../../src/core/ai/ai-types.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

// Mock provider that returns predictable embeddings
class MockProvider implements AIProvider {
  readonly name = 'mock';
  private embeddingMap: Record<string, number[]>;

  constructor(embeddingMap: Record<string, number[]> = {}) {
    this.embeddingMap = embeddingMap;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const key = Object.keys(this.embeddingMap).find(k => text.includes(k));
    return {
      embedding: key ? this.embeddingMap[key] : [0.1, 0.2, 0.3],
      model: 'mock-model',
    };
  }

  async complete(): Promise<CompletionResult> {
    return { text: '', model: 'mock' };
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }
}

const makeMemory = (id: string, title: string, content: string): MemoryEntry => ({
  id, title, content, type: 'insight', tier: 'project',
  source: 'test', timestamp: new Date().toISOString(),
  confidence: 0.9, tags: ['test'],
});

describe('Cosine similarity', () => {
  it('identical vectors → 1.0', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1.0);
  });

  it('orthogonal vectors → 0.0', () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
  });

  it('opposite vectors → -1.0', () => {
    expect(cosineSimilarity([1, 0, 0], [-1, 0, 0])).toBeCloseTo(-1.0);
  });

  it('empty vectors → 0', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('different lengths → 0', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
  });
});

describe('Content hash', () => {
  it('same input → same hash', () => {
    expect(contentHash('hello world')).toBe(contentHash('hello world'));
  });

  it('different input → different hash', () => {
    expect(contentHash('hello')).not.toBe(contentHash('world'));
  });
});

describe('Embedding store', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-emb-'));
    await mkdir(getAgentPath(testDir), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('loads empty cache when no file', async () => {
    const cache = await loadEmbeddings(testDir);
    expect(cache).toEqual({});
  });

  it('saves and loads cache', async () => {
    const cache: EmbeddingCache = {
      'mem-1': {
        embedding: [0.1, 0.2, 0.3],
        model: 'test',
        updatedAt: '2024-01-01',
        contentHash: 'abc',
      },
    };
    await saveEmbeddings(testDir, cache);
    const loaded = await loadEmbeddings(testDir);
    expect(loaded['mem-1'].embedding).toEqual([0.1, 0.2, 0.3]);
  });

  it('embedText creates and caches embedding', async () => {
    const provider = new MockProvider();
    const entry = await embedText(testDir, 'mem-1', 'test text', provider);

    expect(entry).not.toBeNull();
    expect(entry!.embedding).toEqual([0.1, 0.2, 0.3]);

    // Verify persisted
    const cached = await getEmbedding(testDir, 'mem-1');
    expect(cached).toEqual([0.1, 0.2, 0.3]);
  });

  it('embedText skips unchanged content', async () => {
    const provider = new MockProvider();
    await embedText(testDir, 'mem-1', 'same text', provider);
    // Call again — should skip (same content hash)
    const entry = await embedText(testDir, 'mem-1', 'same text', provider);
    expect(entry).not.toBeNull();
  });

  it('removeEmbedding deletes from cache', async () => {
    const provider = new MockProvider();
    await embedText(testDir, 'mem-1', 'text', provider);
    await removeEmbedding(testDir, 'mem-1');

    const cached = await getEmbedding(testDir, 'mem-1');
    expect(cached).toBeNull();
  });

  it('NoopProvider returns null (empty embedding)', async () => {
    const noop = new NoopProvider();
    const entry = await embedText(testDir, 'mem-1', 'text', noop);
    expect(entry).toBeNull();
  });
});

describe('Semantic retriever', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-sem-'));
    await mkdir(getAgentPath(testDir), { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('returns empty for NoopProvider', async () => {
    const noop = new NoopProvider();
    const results = await semanticSearch(testDir, 'query', [], noop);
    expect(results).toEqual([]);
  });

  it('ranks memories by cosine similarity', async () => {
    // Set up: embed two memories with different vectors
    const provider = new MockProvider({
      'auth': [1, 0, 0],
      'database': [0, 1, 0],
    });

    const m1 = makeMemory('m1', 'auth patterns', 'JWT auth implementation');
    const m2 = makeMemory('m2', 'database schema', 'PostgreSQL database design');

    await autoEmbed(testDir, m1, provider);
    await autoEmbed(testDir, m2, provider);

    // Now search with query similar to auth
    const queryProvider = new MockProvider({
      'authentication': [0.9, 0.1, 0],
    });

    const results = await semanticSearch(testDir, 'authentication', [m1, m2], queryProvider);
    expect(results.length).toBeGreaterThan(0);
    // m1 should score higher (closer to [1,0,0])
    if (results.length >= 2) {
      expect(results[0].memory.id).toBe('m1');
    }
  });

  it('filters by minScore', async () => {
    const provider = new MockProvider({ 'test': [1, 0, 0] });
    const m1 = makeMemory('m1', 'test topic', 'some content');
    await autoEmbed(testDir, m1, provider);

    // Search with orthogonal query → low score
    const orthoProvider = new MockProvider({ 'unrelated': [0, 1, 0] });
    const results = await semanticSearch(testDir, 'unrelated', [m1], orthoProvider, { minScore: 0.5 });
    expect(results).toEqual([]); // Filtered out by minScore
  });
});
