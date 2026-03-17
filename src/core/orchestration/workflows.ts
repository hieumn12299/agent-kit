import { StateGraph, END } from './graph-builder.js';
import { listAllMemories } from '../memory/memory-store.js';
import { promoteMemory, getDefaultPromotionTarget } from '../memory/promoter.js';
import type { MemoryEntry } from '../../types/memory.js';

// ── Types ────────────────────────────────────────────────────────────

interface ConsolidationState {
  [key: string]: unknown;
  root: string;
  memories: MemoryEntry[];
  duplicates: Array<{ kept: string; removed: string }>;
  promoted: string[];
  phase: 'scan' | 'dedupe' | 'promote' | 'done';
  iteration: number;
  maxPromotions: number;
}

interface ReviewState {
  [key: string]: unknown;
  root: string;
  memories: MemoryEntry[];
  staleMemories: string[];
  lowConfidence: string[];
  report: string;
  phase: 'scan' | 'analyze' | 'report' | 'done';
}

// ── Workflow: Memory Consolidation ───────────────────────────────────

/**
 * Memory consolidation workflow:
 * Scan → Dedupe → Promote → Done
 *
 * Scans all memories, identifies duplicates by title similarity,
 * and promotes high-confidence working memories to project tier.
 */
export const buildConsolidationGraph = () => {
  const graph = new StateGraph<ConsolidationState>();

  graph.addNode('scan', async (state) => {
    const memories = await listAllMemories(state.root);
    return { memories, phase: 'dedupe' as const };
  });

  graph.addNode('dedupe', async (state) => {
    const seen = new Map<string, MemoryEntry>();
    const duplicates: ConsolidationState['duplicates'] = [];

    for (const m of state.memories) {
      const key = m.title.toLowerCase().trim();
      if (seen.has(key)) {
        // Keep the one with higher confidence
        const existing = seen.get(key)!;
        if (m.confidence > existing.confidence) {
          duplicates.push({ kept: m.id, removed: existing.id });
          seen.set(key, m);
        } else {
          duplicates.push({ kept: existing.id, removed: m.id });
        }
      } else {
        seen.set(key, m);
      }
    }

    return { duplicates, phase: 'promote' as const };
  });

  graph.addNode('promote', async (state) => {
    const promoted: string[] = [];
    const workingMemories = state.memories.filter(
      m => m.tier === 'working' && m.confidence >= 0.8,
    );

    for (const m of workingMemories.slice(0, state.maxPromotions)) {
      const target = getDefaultPromotionTarget(m.tier);
      if (target) {
        const result = await promoteMemory(state.root, m.id, m.tier, target);
        if (result.ok) promoted.push(m.id);
      }
    }

    return { promoted, phase: 'done' as const };
  });

  graph
    .setEntryPoint('scan')
    .addEdge('scan', 'dedupe')
    .addEdge('dedupe', 'promote')
    .addEdge('promote', END);

  return graph.compile();
};

// ── Workflow: Memory Review ──────────────────────────────────────────

/**
 * Memory review workflow:
 * Scan → Analyze → Report → Done
 *
 * Scans all memories, identifies stale and low-confidence entries,
 * generates a review report.
 */
export const buildReviewGraph = () => {
  const graph = new StateGraph<ReviewState>();
  const STALE_DAYS = 30;

  graph.addNode('scan', async (state) => {
    const memories = await listAllMemories(state.root);
    return { memories, phase: 'analyze' as const };
  });

  graph.addNode('analyze', async (state) => {
    const now = Date.now();
    const staleMemories: string[] = [];
    const lowConfidence: string[] = [];

    for (const m of state.memories) {
      const age = now - new Date(m.timestamp).getTime();
      if (age > STALE_DAYS * 24 * 60 * 60 * 1000) {
        staleMemories.push(m.id);
      }
      if (m.confidence < 0.5) {
        lowConfidence.push(m.id);
      }
    }

    return { staleMemories, lowConfidence, phase: 'report' as const };
  });

  graph.addNode('report', async (state) => {
    const lines = [
      `Memory Review Report`,
      `Total: ${state.memories.length} memories`,
      `Stale (>${STALE_DAYS}d): ${state.staleMemories.length}`,
      `Low confidence (<0.5): ${state.lowConfidence.length}`,
    ];

    if (state.staleMemories.length > 0) {
      lines.push(`\nStale IDs: ${state.staleMemories.join(', ')}`);
    }
    if (state.lowConfidence.length > 0) {
      lines.push(`Low confidence IDs: ${state.lowConfidence.join(', ')}`);
    }

    return { report: lines.join('\n'), phase: 'done' as const };
  });

  graph
    .setEntryPoint('scan')
    .addEdge('scan', 'analyze')
    .addEdge('analyze', 'report')
    .addEdge('report', END);

  return graph.compile();
};

// ── Registry ─────────────────────────────────────────────────────────

export const WORKFLOWS = {
  'memory-consolidation': {
    name: 'memory-consolidation',
    description: 'Scan → Dedupe → Promote high-confidence working memories',
    build: buildConsolidationGraph,
  },
  'memory-review': {
    name: 'memory-review',
    description: 'Scan → Analyze → Report stale + low-confidence memories',
    build: buildReviewGraph,
  },
} as const;

export type WorkflowName = keyof typeof WORKFLOWS;
