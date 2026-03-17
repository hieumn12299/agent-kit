import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getAgentPath } from '../../utils/file-system.js';
import { registry } from './plugin-registry.js';
import type { AgentPlugin, LoadedPlugin } from './plugin-types.js';
import { ok, err, type Result } from '../../types/result.js';

const PLUGINS_DIR = 'plugins';

/**
 * Get the plugins directory path.
 */
export const getPluginsDir = (root: string): string =>
  join(getAgentPath(root), PLUGINS_DIR);

/**
 * Discover and load all plugins from .agent/plugins/.
 * Each plugin is a directory containing an index.js (ESM default export).
 */
export const loadPlugins = async (root: string): Promise<LoadedPlugin[]> => {
  const pluginsDir = getPluginsDir(root);
  const loaded: LoadedPlugin[] = [];

  let entries: string[];
  try {
    entries = await readdir(pluginsDir);
  } catch {
    return []; // No plugins dir = no plugins
  }

  for (const entry of entries) {
    const pluginPath = join(pluginsDir, entry);
    const s = await stat(pluginPath).catch(() => null);
    if (!s || !s.isDirectory()) continue;

    const result = await loadPlugin(pluginPath);
    if (result.ok) {
      loaded.push(result.value);
    }
  }

  return loaded;
};

/**
 * Load a single plugin from its directory.
 */
export const loadPlugin = async (
  pluginPath: string,
): Promise<Result<LoadedPlugin, Error>> => {
  const indexPath = join(pluginPath, 'index.js');

  try {
    const fileUrl = pathToFileURL(indexPath).href;
    const mod = await import(fileUrl);
    const plugin = (mod.default ?? mod) as AgentPlugin;

    // Validate plugin shape
    if (!plugin.name || typeof plugin.name !== 'string') {
      return err(new Error(`Plugin at '${pluginPath}' missing 'name' field.`));
    }
    if (!plugin.version || typeof plugin.version !== 'string') {
      return err(new Error(`Plugin '${plugin.name}' missing 'version' field.`));
    }

    const loaded: LoadedPlugin = {
      plugin,
      path: pluginPath,
      loadedAt: new Date().toISOString(),
    };

    // Register in global registry
    registry.register(loaded);

    return ok(loaded);
  } catch (e) {
    return err(
      new Error(`Failed to load plugin at '${pluginPath}': ${e instanceof Error ? e.message : String(e)}`),
    );
  }
};

/**
 * Scaffold a new plugin template in .agent/plugins/<name>/.
 */
export const scaffoldPlugin = async (
  root: string,
  name: string,
): Promise<Result<string, Error>> => {
  const { mkdir, writeFile } = await import('node:fs/promises');
  const pluginDir = join(getPluginsDir(root), name);

  try {
    await mkdir(pluginDir, { recursive: true });

    const indexContent = `// ${name} plugin for agent-kit
export default {
  name: '${name}',
  version: '0.1.0',
  description: 'A custom agent-kit plugin',

  // Optional: custom retriever
  // retriever: {
  //   name: '${name}-retriever',
  //   retrieve: async (query, memories, options) => [],
  //   priority: 0,
  // },

  // Optional: custom memory types
  // memoryTypes: [
  //   { name: 'custom-type', description: 'A custom memory type' },
  // ],

  // Optional: lifecycle hooks
  // hooks: {
  //   onMemoryCreate: async (entry) => {},
  //   onSessionStart: async (sessionId) => {},
  //   onSessionEnd: async (sessionId) => {},
  // },
};
`;

    await writeFile(join(pluginDir, 'index.js'), indexContent, 'utf-8');

    return ok(pluginDir);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
};
