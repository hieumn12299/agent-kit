import type { Command } from 'commander';
import { input } from '@inquirer/prompts';
import {
  loadConfig,
  updateConfig,
  resetConfig,
  configToEntries,
  getConfigValue,
} from '../../core/config/config-manager.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { isNonInteractive } from '../env.js';
import { getOutputMode, requireInit } from '../utils.js';



export const registerConfigCommand = (program: Command): void => {
  const config = program
    .command('config')
    .description('View and modify Agent-Kit settings');

  // agent config list
  config
    .command('list')
    .description('Show all config settings')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      if (!(await requireInit(root, fmt))) return;

      const result = await loadConfig(root);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      const entries = configToEntries(result.value);
      const defaults = ['', '', '', 'false', 'project'];
      fmt.table(
        ['Key', 'Value', 'Default'],
        entries.map(([key, val], i) => [key, val, defaults[i]]),
      );
    });

  // agent config get <key>
  config
    .command('get <key>')
    .description('Get a config value')
    .action(async function (this: Command, key: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      if (!(await requireInit(root, fmt))) return;

      const result = await loadConfig(root);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      const value = getConfigValue(result.value, key);
      if (value === undefined) {
        fmt.error(`Unknown config key: ${key}`);
        return;
      }

      if (mode === 'json') {
        console.log(JSON.stringify({ key, value }));
      } else {
        console.log(value);
      }
    });

  // agent config set <key> <value>
  config
    .command('set <key> <value>')
    .description('Set a config value')
    .action(async function (this: Command, key: string, value: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      if (!(await requireInit(root, fmt))) return;

      const result = await updateConfig(root, key, value);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }
      fmt.success(`Set ${key} = ${value}`);
    });

  // agent config reset
  config
    .command('reset')
    .description('Reset config to defaults')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      if (!(await requireInit(root, fmt))) return;

      // Block reset in non-interactive mode
      if (isNonInteractive()) {
        fmt.error('Cannot reset config in non-interactive mode. Run interactively to confirm.');
        return;
      }

      const answer = await input({
        message: "Type 'yes' to confirm reset:",
      });
      if (answer !== 'yes') {
        fmt.info('Reset cancelled.');
        return;
      }

      const result = await resetConfig(root);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }
      fmt.success('Config reset to defaults.');
    });

  // agent config ai [provider]
  config
    .command('ai [provider]')
    .description('Configure AI provider (ollama, openai, none)')
    .option('--model <model>', 'Completion model')
    .option('--embedding-model <model>', 'Embedding model')
    .option('--base-url <url>', 'API base URL')
    .option('--api-key <key>', 'API key')
    .action(async function (this: Command, provider?: string) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      if (!(await requireInit(root, fmt))) return;

      const { getAIConfig, setAIConfig } = await import('../../core/ai/ai-config.js');
      const { OLLAMA_DEFAULTS, OPENAI_DEFAULTS } = await import('../../core/ai/ai-types.js');

      // Show current config if no args
      if (!provider) {
        const current = await getAIConfig(root);
        if (mode === 'json') {
          console.log(JSON.stringify(current));
        } else {
          fmt.info('AI Configuration:');
          console.log(`  Provider: ${current.provider}`);
          console.log(`  Embedding model: ${current.embeddingModel}`);
          console.log(`  Completion model: ${current.completionModel}`);
          if (current.baseUrl) console.log(`  Base URL: ${current.baseUrl}`);
          if (current.apiKey) console.log(`  API key: ***${current.apiKey.slice(-4)}`);
        }
        return;
      }

      // Set provider
      const validProviders = ['ollama', 'openai', 'none'] as const;
      if (!(validProviders as readonly string[]).includes(provider)) {
        fmt.error(`Invalid provider '${provider}'. Valid: ${validProviders.join(', ')}`);
        return;
      }

      const opts = this.opts();
      const defaults = provider === 'ollama' ? OLLAMA_DEFAULTS
        : provider === 'openai' ? OPENAI_DEFAULTS
        : {};

      await setAIConfig(root, {
        provider: provider as 'ollama' | 'openai' | 'none',
        ...defaults,
        ...(opts.model ? { completionModel: opts.model } : {}),
        ...(opts.embeddingModel ? { embeddingModel: opts.embeddingModel } : {}),
        ...(opts.baseUrl ? { baseUrl: opts.baseUrl } : {}),
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
      });

      if (mode === 'json') {
        console.log(JSON.stringify({ status: 'configured', provider }));
      } else {
        fmt.success(`AI provider set to '${provider}'.`);
        if (provider === 'ollama') {
          console.log('  Run `ollama pull nomic-embed-text` + `ollama pull llama3.2` to get started.');
        }
        if (provider === 'openai' && !opts.apiKey) {
          console.log('  Run `agent config ai openai --api-key YOUR_KEY` to set API key.');
        }
      }
    });
};
