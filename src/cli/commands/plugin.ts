import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { getOutputMode, requireInit } from '../utils.js';
import { registry } from '../../core/plugins/plugin-registry.js';
import { loadPlugins, scaffoldPlugin } from '../../core/plugins/plugin-loader.js';

export const registerPluginCommand = (program: Command): void => {
  const plugin = program
    .command('plugin')
    .description('Manage agent-kit plugins');

  // ── plugin list ──────────────────────────────────────────────────
  plugin
    .command('list')
    .description('List installed plugins')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      if (!(await requireInit(root, fmt))) return;

      // Load plugins if not already loaded
      await loadPlugins(root);
      const plugins = registry.listPlugins();

      if (mode === 'json') {
        console.log(JSON.stringify(plugins.map(p => ({
          name: p.plugin.name,
          version: p.plugin.version,
          description: p.plugin.description,
          path: p.path,
          loadedAt: p.loadedAt,
          hasRetriever: !!p.plugin.retriever,
          memoryTypes: p.plugin.memoryTypes?.map(mt => mt.name) ?? [],
          hasHooks: !!p.plugin.hooks,
        }))));
        return;
      }

      if (plugins.length === 0) {
        fmt.info("No plugins installed. Run 'agent plugin init <name>' to create one.");
        return;
      }

      fmt.info(`${plugins.length} plugin(s) installed:`);
      for (const p of plugins) {
        const features = [];
        if (p.plugin.retriever) features.push('retriever');
        if (p.plugin.memoryTypes?.length) features.push(`${p.plugin.memoryTypes.length} types`);
        if (p.plugin.hooks) features.push('hooks');
        console.log(`  🔌 ${p.plugin.name} v${p.plugin.version} [${features.join(', ') || 'no features'}]`);
        if (p.plugin.description) console.log(`     ${p.plugin.description}`);
      }
    });

  // ── plugin init ──────────────────────────────────────────────────
  plugin
    .command('init <name>')
    .description('Scaffold a new plugin template')
    .action(async function (this: Command, name: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      if (!(await requireInit(root, fmt))) return;

      const result = await scaffoldPlugin(root, name);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'created', name, path: result.value }));
      } else {
        fmt.success(`Plugin '${name}' scaffolded at ${result.value}`);
        console.log(`  Edit .agent/plugins/${name}/index.js to customize.`);
      }
    });
};
