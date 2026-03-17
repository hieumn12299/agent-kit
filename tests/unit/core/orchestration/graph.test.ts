import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { StateGraph, END } from '../../../../src/core/orchestration/graph-builder.js';
import { buildConsolidationGraph, buildReviewGraph } from '../../../../src/core/orchestration/workflows.js';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import { createMemory } from '../../../../src/core/memory/memory-store.js';

// Mock homedir for knowledge tier
let knowledgeDir: string;
vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => knowledgeDir };
});

describe('StateGraph builder', () => {
  interface TestState {
    [key: string]: unknown;
    count: number;
    history: string[];
  }

  it('builds and executes a simple linear graph', async () => {
    const graph = new StateGraph<TestState>();

    graph.addNode('step1', async () => ({ count: 1, history: ['step1'] }));
    graph.addNode('step2', async (s) => ({
      count: (s.count as number) + 1,
      history: [...(s.history as string[]), 'step2'],
    }));

    graph.setEntryPoint('step1')
      .addEdge('step1', 'step2')
      .addEdge('step2', END);

    const compiled = graph.compile();
    const result = await compiled.invoke({ count: 0, history: [] });

    expect(result.finalState.count).toBe(2);
    expect(result.finalState.history).toEqual(['step1', 'step2']);
    expect(result.iterations).toBe(2);
    expect(result.terminated).toBe(true);
  });

  it('supports conditional edges', async () => {
    const graph = new StateGraph<TestState>();

    graph.addNode('start', async () => ({ count: 5 }));
    graph.addNode('high', async (s) => ({
      history: [...(s.history as string[]), 'high'],
    }));
    graph.addNode('low', async (s) => ({
      history: [...(s.history as string[]), 'low'],
    }));

    graph.setEntryPoint('start')
      .addConditionalEdge('start', (s) =>
        (s.count as number) > 3 ? 'high' : 'low',
      )
      .addEdge('high', END)
      .addEdge('low', END);

    const compiled = graph.compile();
    const result = await compiled.invoke({ count: 0, history: [] });

    expect(result.finalState.history).toContain('high');
  });

  it('enforces maxIterations guard', async () => {
    const graph = new StateGraph<TestState>();

    graph.addNode('loop', async (s) => ({
      count: (s.count as number) + 1,
    }));

    graph.setEntryPoint('loop')
      .addEdge('loop', 'loop'); // Infinite loop

    const compiled = graph.compile();
    const result = await compiled.invoke({ count: 0, history: [] }, { maxIterations: 5 });

    expect(result.iterations).toBe(5);
    expect(result.terminated).toBe(true);
    expect(result.finalState.count).toBe(5);
  });

  it('calls onStep callback', async () => {
    const graph = new StateGraph<TestState>();
    const steps: string[] = [];

    graph.addNode('a', async () => ({ count: 1 }));
    graph.addNode('b', async () => ({ count: 2 }));

    graph.setEntryPoint('a').addEdge('a', 'b').addEdge('b', END);

    const compiled = graph.compile();
    await compiled.invoke({ count: 0, history: [] }, {
      onStep: (step) => steps.push(step.node),
    });

    expect(steps).toEqual(['a', 'b']);
  });

  it('generates execution plan', () => {
    const graph = new StateGraph<TestState>();

    graph.addNode('a', async () => ({}));
    graph.addNode('b', async () => ({}));
    graph.addNode('c', async () => ({}));

    graph.setEntryPoint('a')
      .addEdge('a', 'b')
      .addEdge('b', 'c')
      .addEdge('c', END);

    const compiled = graph.compile();
    expect(compiled.plan()).toEqual(['a', 'b', 'c']);
  });

  it('throws on missing entry point', () => {
    const graph = new StateGraph<TestState>();
    graph.addNode('a', async () => ({}));
    expect(() => graph.compile()).toThrow('No entry point');
  });

  it('throws on duplicate node', () => {
    const graph = new StateGraph<TestState>();
    graph.addNode('a', async () => ({}));
    expect(() => graph.addNode('a', async () => ({}))).toThrow('already exists');
  });

  it('throws on unknown entry point', () => {
    const graph = new StateGraph<TestState>();
    graph.addNode('a', async () => ({}));
    graph.setEntryPoint('nonexistent');
    expect(() => graph.compile()).toThrow("'nonexistent' is not a registered node");
  });
});

describe('Predefined workflows', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-graph-'));
    knowledgeDir = testDir;
    const agentDir = getAgentPath(testDir);
    await mkdir(join(agentDir, 'project'), { recursive: true });
    await mkdir(join(agentDir, 'working'), { recursive: true });

    await createMemory(testDir, {
      title: 'Test insight',
      type: 'insight',
      tier: 'working',
      source: 'test',
      timestamp: new Date().toISOString(),
      confidence: 0.9,
      tags: ['test'],
      content: 'A test insight',
    });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it('memory-review workflow scans and reports', async () => {
    const compiled = buildReviewGraph();
    const result = await compiled.invoke({
      root: testDir,
      memories: [],
      staleMemories: [],
      lowConfidence: [],
      report: '',
      phase: 'scan' as const,
    });

    expect(result.terminated).toBe(true);
    expect(result.iterations).toBe(3); // scan → analyze → report
    expect(result.finalState.report).toContain('Memory Review Report');
    expect(result.finalState.memories.length).toBeGreaterThan(0);
  });

  it('memory-consolidation workflow runs all phases', async () => {
    const compiled = buildConsolidationGraph();
    const result = await compiled.invoke({
      root: testDir,
      memories: [],
      duplicates: [],
      promoted: [],
      phase: 'scan' as const,
      iteration: 0,
      maxPromotions: 5,
    });

    expect(result.terminated).toBe(true);
    expect(result.iterations).toBe(3); // scan → dedupe → promote
    expect(result.finalState.memories.length).toBeGreaterThan(0);
  });
});
