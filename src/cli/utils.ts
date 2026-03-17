import type { Command } from 'commander';
import type { OutputMode } from './output-mode.js';
import { isInitialized } from '../core/config/config-manager.js';
import { ConsoleFormatter } from './output-formatter.js';
import { handleCommandError } from './error-handler.js';
import { ConfigError } from '../types/errors.js';

/**
 * Resolve output mode from global root options.
 * Walks up to the root Command to find --json / --quiet flags.
 */
export const getOutputMode = (cmd: Command): OutputMode => {
  let root = cmd;
  while (root.parent) root = root.parent;
  const opts = root.opts();
  if (opts.json) return 'json';
  if (opts.quiet) return 'quiet';
  return 'default';
};

/**
 * Guard: check if agent-kit is initialized, show error if not.
 * Returns true if initialized, false otherwise.
 */
export const requireInit = async (root: string, fmt: ConsoleFormatter): Promise<boolean> => {
  if (!(await isInitialized(root))) {
    handleCommandError(fmt, new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"));
    return false;
  }
  return true;
};
