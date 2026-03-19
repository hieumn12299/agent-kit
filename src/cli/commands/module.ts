import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { getOutputMode, requireInit } from '../utils.js';
import {
  discoverModules,
  installModule,
  removeModule,
  mergeModuleAssets,
} from '../../core/modules/module-registry.js';

export const registerModuleCommand = (program: Command): void => {
  const mod = program
    .command('module')
    .description('Install, list, and manage skill pack modules');

  // ── module list ──────────────────────────────────────────────────
  mod
    .command('list')
    .description('List installed modules')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      try {
        if (!await requireInit(root, fmt)) return;
        const { join } = await import('node:path');
        const agentDir = join(root, '.agent');

        const modules = await discoverModules(agentDir);

        if (mode === 'json') {
          console.log(JSON.stringify(modules.map(m => ({
            name: m.manifest.name,
            version: m.manifest.version,
            description: m.manifest.description,
            skills: m.skills.length,
            workflows: m.workflows.length,
            agents: m.agentCount,
          }))));
          return;
        }

        if (modules.length === 0) {
          fmt.info('No modules installed.');
          fmt.info("Install one with: agent module install ./path/to/module");
          return;
        }

        fmt.info(`${modules.length} module(s) installed:\n`);
        fmt.table(
          ['Name', 'Version', 'Skills', 'Workflows', 'Agents', 'Description'],
          modules.map(m => [
            m.manifest.name,
            m.manifest.version,
            String(m.skills.length),
            String(m.workflows.length),
            String(m.agentCount),
            (m.manifest.description || '').slice(0, 40),
          ]),
        );
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });

  // ── module install ──────────────────────────────────────────────
  mod
    .command('install <source>')
    .description('Install a module from a local path')
    .action(async function (this: Command, source: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      try {
        if (!await requireInit(root, fmt)) return;
        const { join, resolve } = await import('node:path');
        const agentDir = join(root, '.agent');
        const resolvedSource = resolve(root, source);

        fmt.info(`Installing module from ${resolvedSource}...`);
        const result = await installModule(agentDir, resolvedSource);

        if (!result.ok) {
          fmt.error(result.error);
          return;
        }

        // Merge assets (symlink skills/workflows)
        await mergeModuleAssets(agentDir, result.module);

        if (mode === 'json') {
          console.log(JSON.stringify({
            status: 'installed',
            name: result.module.manifest.name,
            version: result.module.manifest.version,
            skills: result.module.skills,
            workflows: result.module.workflows,
          }));
          return;
        }

        fmt.success(`Module '${result.module.manifest.name}' v${result.module.manifest.version} installed!`);
        fmt.info(`  🧩 ${result.module.skills.length} skills`);
        fmt.info(`  📋 ${result.module.workflows.length} workflows`);
        fmt.info(`  🎭 ${result.module.agentCount} agents`);
        fmt.info('\nRun `agent manifest generate` to update manifests.');
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });

  // ── module remove ──────────────────────────────────────────────
  mod
    .command('remove <name>')
    .description('Remove an installed module')
    .action(async function (this: Command, name: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      try {
        if (!await requireInit(root, fmt)) return;
        const { join } = await import('node:path');
        const agentDir = join(root, '.agent');

        const result = await removeModule(agentDir, name);

        if (!result.ok) {
          fmt.error(result.error);
          return;
        }

        if (mode === 'json') {
          console.log(JSON.stringify({ status: 'removed', name }));
          return;
        }

        fmt.success(`Module '${name}' removed.`);
        fmt.info('Run `agent manifest generate` to update manifests.');
      } catch (e) {
        handleCommandError(fmt, e);
      }
    });
};
