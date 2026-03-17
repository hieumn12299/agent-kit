import { ok, err, type Result } from '../../types/result.js';
import type { MemoryEntry } from '../../types/memory.js';
import { listAllMemories } from '../memory/memory-store.js';
import { listSessions } from '../session/session-store.js';

// ── Types ────────────────────────────────────────────────────────────

export interface EvolutionData {
  totalMemories: number;
  sessionsWithNewMemories: number;
  recentGrowth: { sessionId: string; date: string; memoriesCreated: number }[];
}

export interface QualityMetrics {
  totalMemories: number;
  staleCount: number;
  staleRate: number;
  correctionCount: number;
  avgConfidence: number;
  typeDistribution: Record<string, number>;
}

export interface FullAnalytics {
  evolution: EvolutionData;
  quality: QualityMetrics;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Check if a memory source indicates it came from a session.
 * Convention: `source: 'session:{sessionId}'`
 */
export const parseSessionSource = (source: string): { isSession: boolean; sessionId?: string } => {
  const match = source.match(/^session:(.+)$/);
  return match ? { isSession: true, sessionId: match[1] } : { isSession: false };
};

// Uses shared listAllMemories from memory-store.ts

// ── Compute Functions (pure, from pre-loaded data) ───────────────────

const computeEvolution = (
  allMemories: MemoryEntry[],
  sessions: { sessionId: string; startTime: string }[],
): EvolutionData => {
  // Map session IDs to memory counts
  const sessionMemoryCount = new Map<string, number>();
  for (const memory of allMemories) {
    const parsed = parseSessionSource(memory.source);
    if (parsed.isSession && parsed.sessionId) {
      sessionMemoryCount.set(parsed.sessionId, (sessionMemoryCount.get(parsed.sessionId) ?? 0) + 1);
    }
  }

  // Build growth timeline (most recent first, last 10)
  const sortedSessions = [...sessions]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 10);

  const recentGrowth = sortedSessions
    .filter(s => sessionMemoryCount.has(s.sessionId))
    .map(s => ({
      sessionId: s.sessionId,
      date: s.startTime.split('T')[0],
      memoriesCreated: sessionMemoryCount.get(s.sessionId) ?? 0,
    }));

  return {
    totalMemories: allMemories.length,
    sessionsWithNewMemories: sessionMemoryCount.size,
    recentGrowth,
  };
};

const computeQuality = (allMemories: MemoryEntry[]): QualityMetrics => {
  if (allMemories.length === 0) {
    return {
      totalMemories: 0,
      staleCount: 0,
      staleRate: 0,
      correctionCount: 0,
      avgConfidence: 0,
      typeDistribution: {},
    };
  }

  const staleThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  let staleCount = 0;
  let correctionCount = 0;
  let totalConfidence = 0;
  const typeDistribution: Record<string, number> = {};

  for (const m of allMemories) {
    if (new Date(m.timestamp).getTime() < staleThreshold) staleCount++;
    if (m.source.includes('correction')) correctionCount++;
    totalConfidence += m.confidence;
    typeDistribution[m.type] = (typeDistribution[m.type] ?? 0) + 1;
  }

  return {
    totalMemories: allMemories.length,
    staleCount,
    staleRate: Math.round((staleCount / allMemories.length) * 100),
    correctionCount,
    avgConfidence: Math.round((totalConfidence / allMemories.length) * 100) / 100,
    typeDistribution,
  };
};

// ── Public API ───────────────────────────────────────────────────────

/**
 * Get full analytics in a single pass (loads data once).
 * Use this from status --verbose to avoid duplicate reads.
 */
export const getFullAnalytics = async (
  root: string,
): Promise<Result<FullAnalytics, Error>> => {
  try {
    const [allMemories, sessionsResult] = await Promise.all([
      listAllMemories(root),
      listSessions(root),
    ]);

    const sessions = sessionsResult.ok ? sessionsResult.value : [];

    return ok({
      evolution: computeEvolution(allMemories, sessions),
      quality: computeQuality(allMemories),
    });
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Get memory evolution timeline only.
 */
export const getMemoryEvolution = async (
  root: string,
): Promise<Result<EvolutionData, Error>> => {
  try {
    const [allMemories, sessionsResult] = await Promise.all([
      listAllMemories(root),
      listSessions(root),
    ]);
    const sessions = sessionsResult.ok ? sessionsResult.value : [];
    return ok(computeEvolution(allMemories, sessions));
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * Get quality metrics only.
 */
export const getQualityMetrics = async (
  root: string,
): Promise<Result<QualityMetrics, Error>> => {
  try {
    const allMemories = await listAllMemories(root);
    return ok(computeQuality(allMemories));
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};
