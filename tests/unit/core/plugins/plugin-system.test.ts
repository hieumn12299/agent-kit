import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getAgentPath } from '../../../../src/utils/file-system.js';
import { registry } from '../../../../src/core/plugins/plugin-registry.js';
import { loadPlugins, scaffoldPlugin } from '../../../../src/core/plugins/plugin-loader.js';
import type { AgentPlugin, LoadedPlugin, PluginRetriever } from '../../../../src/core/plugins/plugin-types.js';
import type { MemoryEntry } from '../../../../src/types/memory.js';

describe('plugin-registry', () => {
  beforeEach(() => {
    registry.reset();
  });

  const makePlugin = (overrides?: Partial<AgentPlugin>): AgentPlugin => ({
    name: 'test-plugin',
    version: '1.0.0',
    ...overrides,
  });

  const makeLoaded = (plugin: AgentPlugin): LoadedPlugin => ({
    plugin,
    path: '/test/plugins/test-plugin',
    loadedAt: new Date().toISOString(),
  });

  it('registers and lists plugins', () => {
    const plugin = makePlugin();
    registry.register(makeLoaded(plugin));

    const plugins = registry.listPlugins();
    expect(plugins).toHaveLength(1);
    expect(plugins[0].plugin.name).toBe('test-plugin');
  });

  it('prevents duplicate registration', () => {
    const plugin = makePlugin();
    registry.register(makeLoaded(plugin));
    expect(() => registry.register(makeLoaded(plugin))).toThrow('already registered');
  });

  it('unregisters a plugin', () => {
    const plugin = makePlugin();
    registry.register(makeLoaded(plugin));
    const removed = registry.unregister('test-plugin');
    expect(removed).toBe(true);
    expect(registry.listPlugins()).toHaveLength(0);
  });

  it('indexes retrievers by priority', () => {
    const low: PluginRetriever = {
      name: 'low',
      retrieve: async () => [],
      priority: 1,
    };
    const high: PluginRetriever = {
      name: 'high',
      retrieve: async () => [],
      priority: 10,
    };

    registry.register(makeLoaded(makePlugin({ name: 'p1', retriever: low })));
    registry.register(makeLoaded(makePlugin({ name: 'p2', retriever: high })));

    const retrievers = registry.getRetrievers();
    expect(retrievers[0].name).toBe('high');
    expect(retrievers[1].name).toBe('low');
  });

  it('indexes memory types', () => {
    const plugin = makePlugin({
      memoryTypes: [
        { name: 'api-doc', description: 'API documentation' },
        { name: 'migration', description: 'DB migration notes' },
      ],
    });
    registry.register(makeLoaded(plugin));

    expect(registry.getMemoryType('api-doc')).toBeDefined();
    expect(registry.getMemoryType('migration')?.description).toBe('DB migration notes');
    expect(registry.listMemoryTypes()).toHaveLength(2);
  });

  it('invokes hooks in order', async () => {
    const calls: string[] = [];
    const plugin = makePlugin({
      hooks: {
        onMemoryCreate: async () => { calls.push('create'); },
        onSessionStart: async () => { calls.push('start'); },
      },
    });
    registry.register(makeLoaded(plugin));

    await registry.invokeOnMemoryCreate({} as MemoryEntry);
    await registry.invokeOnSessionStart('session-1');

    expect(calls).toEqual(['create', 'start']);
  });

  it('swallows hook errors without breaking', async () => {
    const plugin = makePlugin({
      hooks: {
        onMemoryCreate: async () => { throw new Error('boom'); },
      },
    });
    registry.register(makeLoaded(plugin));

    // Should not throw
    await expect(registry.invokeOnMemoryCreate({} as MemoryEntry)).resolves.toBeUndefined();
  });

  it('runs retrievers and merges results', async () => {
    const memory: MemoryEntry = {
      id: 'm1', title: 'Test', type: 'insight', tier: 'project',
      source: 'test', timestamp: '', confidence: 1, tags: [], content: '',
    };

    const retriever: PluginRetriever = {
      name: 'custom',
      retrieve: async () => [{ memory, score: 0.95 }],
    };

    registry.register(makeLoaded(makePlugin({ retriever })));
    const results = await registry.runRetrievers('test query', [memory]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(0.95);
  });

  it('deduplicates retriever results by memory ID', async () => {
    const memory: MemoryEntry = {
      id: 'dup-1', title: 'Dup', type: 'insight', tier: 'project',
      source: 'test', timestamp: '', confidence: 1, tags: [], content: '',
    };

    const r1: PluginRetriever = {
      name: 'r1',
      retrieve: async () => [{ memory, score: 0.9 }],
      priority: 10,
    };
    const r2: PluginRetriever = {
      name: 'r2',
      retrieve: async () => [{ memory, score: 0.8 }],
      priority: 5,
    };

    registry.register(makeLoaded(makePlugin({ name: 'p1', retriever: r1 })));
    registry.register(makeLoaded(makePlugin({ name: 'p2', retriever: r2 })));

    const results = await registry.runRetrievers('query', [memory]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(0.9); // Higher priority ran first
  });
});

describe('plugin-loader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'agent-plugin-'));
    const agentDir = getAgentPath(testDir);
    await mkdir(agentDir, { recursive: true });
    registry.reset();
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
    registry.reset();
  });

  it('returns empty when no plugins dir', async () => {
    const loaded = await loadPlugins(testDir);
    expect(loaded).toHaveLength(0);
  });

  it('scaffolds a plugin template', async () => {
    const result = await scaffoldPlugin(testDir, 'my-plugin');
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    // Load the scaffolded plugin
    const loaded = await loadPlugins(testDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].plugin.name).toBe('my-plugin');
    expect(loaded[0].plugin.version).toBe('0.1.0');
  });

  it('loads valid plugin from directory', async () => {
    const pluginsDir = join(getAgentPath(testDir), 'plugins', 'test-loader');
    await mkdir(pluginsDir, { recursive: true });
    await writeFile(join(pluginsDir, 'index.js'), `
      export default {
        name: 'test-loader',
        version: '2.0.0',
        description: 'A test plugin',
      };
    `, 'utf-8');

    const loaded = await loadPlugins(testDir);
    expect(loaded).toHaveLength(1);
    expect(loaded[0].plugin.name).toBe('test-loader');
    expect(loaded[0].plugin.version).toBe('2.0.0');
  });

  it('skips invalid plugin (missing name)', async () => {
    const pluginsDir = join(getAgentPath(testDir), 'plugins', 'bad-plugin');
    await mkdir(pluginsDir, { recursive: true });
    await writeFile(join(pluginsDir, 'index.js'), `
      export default { version: '1.0.0' };
    `, 'utf-8');

    const loaded = await loadPlugins(testDir);
    expect(loaded).toHaveLength(0);
  });
});
