import type { MemoryEntry, MemoryTier } from '../../types/memory.js';
import type { ScoredMemory } from '../retrieval/retrieval-engine.js';

// ── Plugin Interface ─────────────────────────────────────────────────

/**
 * Plugin manifest — defines what a plugin provides.
 */
export interface AgentPlugin {
  name: string;
  version: string;
  description?: string;

  /** Custom retriever — called during smartRetrieve if registered. */
  retriever?: PluginRetriever;

  /** Custom memory types the plugin handles. */
  memoryTypes?: PluginMemoryType[];

  /** Lifecycle hooks. */
  hooks?: PluginHooks;
}

/**
 * Custom retriever that can augment or replace built-in retrieval.
 */
export interface PluginRetriever {
  name: string;
  /**
   * Called with query + all memories. Returns scored results.
   * Results are merged with built-in retriever results.
   */
  retrieve: (
    query: string,
    memories: MemoryEntry[],
    options?: { limit?: number },
  ) => Promise<ScoredMemory[]>;
  /** Priority: higher runs first. Default: 0. */
  priority?: number;
}

/**
 * Custom memory type definition.
 */
export interface PluginMemoryType {
  name: string;
  description: string;
  /** Default tier for this memory type. */
  defaultTier?: MemoryTier;
  /** Default tags applied to memories of this type. */
  defaultTags?: string[];
}

/**
 * Lifecycle hooks for plugin integration.
 */
export interface PluginHooks {
  onMemoryCreate?: (entry: MemoryEntry) => Promise<void>;
  onMemoryDelete?: (id: string, tier: MemoryTier) => Promise<void>;
  onSessionStart?: (sessionId: string) => Promise<void>;
  onSessionEnd?: (sessionId: string) => Promise<void>;
}

/**
 * Result of loading a plugin.
 */
export interface LoadedPlugin {
  plugin: AgentPlugin;
  path: string;
  loadedAt: string;
}
