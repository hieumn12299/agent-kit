import type { Command } from 'commander';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { ConfigError } from '../../types/errors.js';
import { isInitialized } from '../../core/config/config-manager.js';
import { getOutputMode } from '../utils.js';

export const registerMcpCommand = (program: Command): void => {
  const mcp = program
    .command('mcp')
    .description('MCP server for IDE integration');

  mcp
    .command('start')
    .description('Start MCP server on stdio (for IDE agents)')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();

      if (!(await isInitialized(root))) {
        handleCommandError(
          fmt,
          new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"),
        );
        return;
      }

      const { startMcpServer } = await import('../../mcp/mcp-server.js');
      await startMcpServer(root);
    });
};
