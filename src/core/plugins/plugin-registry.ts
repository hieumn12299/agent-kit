import type {
  LoadedPlugin,
  PluginRetriever,
  PluginMemoryType,
  PluginHooks,
} from './plugin-types.js';
import type { MemoryEntry, MemoryTier } from '../../types/memory.js';
import type { ScoredMemory } from '../retrieval/retrieval-engine.js';

// ── Registry ─────────────────────────────────────────────────────────

/**
 * Central registry for loaded plugins.
 * Singleton pattern — one registry per process.
 */
class PluginRegistry {
  private plugins: Map<string, LoadedPlugin> = new Map();
  private retrievers: PluginRetriever[] = [];
  private memoryTypes: Map<string, PluginMemoryType> = new Map();
  private hooks: {
    onMemoryCreate: Array<NonNullable<PluginHooks['onMemoryCreate']>>;
    onMemoryDelete: Array<NonNullable<PluginHooks['onMemoryDelete']>>;
    onSessionStart: Array<NonNullable<PluginHooks['onSessionStart']>>;
    onSessionEnd: Array<NonNullable<PluginHooks['onSessionEnd']>>;
  } = {
    onMemoryCreate: [],
    onMemoryDelete: [],
    onSessionStart: [],
    onSessionEnd: [],
  };

  /**
   * Register a plugin and index its capabilities.
   */
  register(loaded: LoadedPlugin): void {
    const { plugin } = loaded;

    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered.`);
    }

    this.plugins.set(plugin.name, loaded);

    // Index retriever
    if (plugin.retriever) {
      this.retrievers.push(plugin.retriever);
      // Sort by priority descending (higher runs first)
      this.retrievers.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    }

    // Index memory types
    if (plugin.memoryTypes) {
      for (const mt of plugin.memoryTypes) {
        this.memoryTypes.set(mt.name, mt);
      }
    }

    // Index hooks
    if (plugin.hooks) {
      if (plugin.hooks.onMemoryCreate) this.hooks.onMemoryCreate.push(plugin.hooks.onMemoryCreate);
      if (plugin.hooks.onMemoryDelete) this.hooks.onMemoryDelete.push(plugin.hooks.onMemoryDelete);
      if (plugin.hooks.onSessionStart) this.hooks.onSessionStart.push(plugin.hooks.onSessionStart);
      if (plugin.hooks.onSessionEnd) this.hooks.onSessionEnd.push(plugin.hooks.onSessionEnd);
    }
  }

  /**
   * Unregister a plugin by name.
   */
  unregister(name: string): boolean {
    const loaded = this.plugins.get(name);
    if (!loaded) return false;

    const { plugin } = loaded;

    // Remove retriever
    if (plugin.retriever) {
      this.retrievers = this.retrievers.filter(r => r.name !== plugin.retriever!.name);
    }

    // Remove memory types
    if (plugin.memoryTypes) {
      for (const mt of plugin.memoryTypes) {
        this.memoryTypes.delete(mt.name);
      }
    }

    // Remove hooks (by reference — requires exact match)
    if (plugin.hooks) {
      if (plugin.hooks.onMemoryCreate) {
        this.hooks.onMemoryCreate = this.hooks.onMemoryCreate.filter(h => h !== plugin.hooks!.onMemoryCreate);
      }
      if (plugin.hooks.onMemoryDelete) {
        this.hooks.onMemoryDelete = this.hooks.onMemoryDelete.filter(h => h !== plugin.hooks!.onMemoryDelete);
      }
      if (plugin.hooks.onSessionStart) {
        this.hooks.onSessionStart = this.hooks.onSessionStart.filter(h => h !== plugin.hooks!.onSessionStart);
      }
      if (plugin.hooks.onSessionEnd) {
        this.hooks.onSessionEnd = this.hooks.onSessionEnd.filter(h => h !== plugin.hooks!.onSessionEnd);
      }
    }

    this.plugins.delete(name);
    return true;
  }

  // ── Queries ──────────────────────────────────────────────────────

  getPlugin(name: string): LoadedPlugin | undefined {
    return this.plugins.get(name);
  }

  listPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  getRetrievers(): PluginRetriever[] {
    return [...this.retrievers];
  }

  getMemoryType(name: string): PluginMemoryType | undefined {
    return this.memoryTypes.get(name);
  }

  listMemoryTypes(): PluginMemoryType[] {
    return Array.from(this.memoryTypes.values());
  }

  // ── Hook Invocation ──────────────────────────────────────────────

  async invokeOnMemoryCreate(entry: MemoryEntry): Promise<void> {
    for (const hook of this.hooks.onMemoryCreate) {
      await hook(entry).catch(() => {}); // Don't let plugin errors break core
    }
  }

  async invokeOnMemoryDelete(id: string, tier: MemoryTier): Promise<void> {
    for (const hook of this.hooks.onMemoryDelete) {
      await hook(id, tier).catch(() => {});
    }
  }

  async invokeOnSessionStart(sessionId: string): Promise<void> {
    for (const hook of this.hooks.onSessionStart) {
      await hook(sessionId).catch(() => {});
    }
  }

  async invokeOnSessionEnd(sessionId: string): Promise<void> {
    for (const hook of this.hooks.onSessionEnd) {
      await hook(sessionId).catch(() => {});
    }
  }

  // ── Retrieval Integration ────────────────────────────────────────

  /**
   * Run all plugin retrievers and merge results.
   * Returns scored memories from all plugins, deduplicated.
   */
  async runRetrievers(
    query: string,
    memories: MemoryEntry[],
    options?: { limit?: number },
  ): Promise<ScoredMemory[]> {
    if (this.retrievers.length === 0) return [];

    const allResults: ScoredMemory[] = [];
    const seenIds = new Set<string>();

    for (const retriever of this.retrievers) {
      const results = await retriever.retrieve(query, memories, options).catch(() => []);
      for (const r of results) {
        if (!seenIds.has(r.memory.id)) {
          seenIds.add(r.memory.id);
          allResults.push(r);
        }
      }
    }

    return allResults;
  }

  /**
   * Reset registry (for testing).
   */
  reset(): void {
    this.plugins.clear();
    this.retrievers = [];
    this.memoryTypes.clear();
    this.hooks = {
      onMemoryCreate: [],
      onMemoryDelete: [],
      onSessionStart: [],
      onSessionEnd: [],
    };
  }
}

// ── Singleton ────────────────────────────────────────────────────────

export const registry = new PluginRegistry();
