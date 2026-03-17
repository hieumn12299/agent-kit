#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { registerInitCommand } from './cli/commands/init.js';
import { registerConfigCommand } from './cli/commands/config.js';
import { registerStartCommand } from './cli/commands/start.js';
import { registerEndCommand } from './cli/commands/end.js';
import { registerStatusCommand } from './cli/commands/status.js';
import { registerMemoryCommand } from './cli/commands/memory.js';
import { registerContextCommand } from './cli/commands/context.js';
import { registerDoctorCommand } from './cli/commands/doctor.js';
import { registerExportCommand } from './cli/commands/export.js';
import { registerMcpCommand } from './cli/commands/mcp.js';
import { registerLockCommand } from './cli/commands/lock.js';
import { registerPluginCommand } from './cli/commands/plugin.js';
import { registerGraphCommand } from './cli/commands/graph.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));

/**
 * Create and configure the CLI program.
 * Exported for testing.
 */
export const createProgram = (): Command => {
  const program = new Command();

  program
    .name('agent')
    .description('Agent-Kit — AI memory for developers')
    .version(pkg.version, '-V, --version', 'Output the current version')
    .option('--json', 'Output in JSON format')
    .option('--quiet', 'Suppress non-error output');

  // Custom help footer
  program.addHelpText('after', `
💡 Run 'agent <command> --help' for more info on a command.
📁 All data stays local in .agent/
`);

  registerInitCommand(program);
  registerConfigCommand(program);
  registerStartCommand(program);
  registerEndCommand(program);
  registerStatusCommand(program);
  registerMemoryCommand(program);
  registerContextCommand(program);
  registerDoctorCommand(program);
  registerExportCommand(program);
  registerMcpCommand(program);
  registerLockCommand(program);
  registerPluginCommand(program);
  registerGraphCommand(program);

  return program;
};

// Run CLI only when executed as entry point (not when imported in tests)

const isEntryPoint = (() => {
  try {
    const thisFile = realpathSync(fileURLToPath(import.meta.url));
    const executed = process.argv[1] ? realpathSync(resolve(process.argv[1])) : '';
    return thisFile === executed;
  } catch {
    return false;
  }
})();

if (isEntryPoint) {
  const program = createProgram();
  program.parse();
}
