import type { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { isInitialized } from '../../core/config/config-manager.js';
import { startSession, forceStartSession, type StartResult } from '../../core/session/session-manager.js';
import { listSessions } from '../../core/session/session-store.js';
import { timeAgo } from '../../core/session/session-lock.js';
import { ConsoleFormatter } from '../output-formatter.js';
import { handleCommandError } from '../error-handler.js';
import { ConfigError } from '../../types/errors.js';
import { isNonInteractive } from '../env.js';
import { getOutputMode } from '../utils.js';
import type { OutputMode } from '../output-mode.js';
import { registry } from '../../core/plugins/plugin-registry.js';



const displayStarted = async (
  fmt: ConsoleFormatter,
  mode: OutputMode,
  result: StartResult,
  root: string,
): Promise<void> => {
  if (result.kind !== 'started') return;
  const session = result.session;

  const sessionsResult = await listSessions(root);
  const memoryCount = sessionsResult.ok ? Math.max(0, sessionsResult.value.length - 1) : 0;

  if (mode === 'json') {
    console.log(JSON.stringify({
      status: 'started',
      sessionId: session.sessionId,
      startTime: session.startTime,
      memoriesAvailable: memoryCount,
    }));
  } else {
    fmt.success(`⚡ Session started (${session.sessionId})`);
    fmt.info(`${memoryCount} previous sessions available.`);
  }
};

export const registerStartCommand = (program: Command): void => {
  program
    .command('start')
    .description('Start a new coding session')
    .action(async function (this: Command) {
      const mode = getOutputMode(this);
      const fmt = new ConsoleFormatter({ mode });
      const root = process.cwd();
      const nonInteractive = isNonInteractive();

      // Check initialization
      if (!(await isInitialized(root))) {
        handleCommandError(
          fmt,
          new ConfigError("Not initialized. Run 'agent init' first.", "Run 'agent init'"),
        );
        return;
      }

      // Start session
      const result = await startSession(root);
      if (!result.ok) {
        handleCommandError(fmt, result.error);
        return;
      }

      const startResult = result.value;

      // Handle orphaned session
      if (startResult.kind === 'orphaned') {
        const { activeSession } = startResult;
        fmt.warning(`⚠️  Previous session still active (started ${timeAgo(activeSession.startTime)}).`);

        if (nonInteractive) {
          // In CI: force end previous and start new
          fmt.info('Non-interactive mode: ending previous session and starting new.');
          const forceResult = await forceStartSession(root, activeSession);
          if (!forceResult.ok) {
            handleCommandError(fmt, forceResult.error);
            return;
          }
          await displayStarted(fmt, mode, forceResult.value, root);
          return;
        }

        // Interactive: show resolution menu
        const choice = await select({
          message: 'How would you like to proceed?',
          choices: [
            { name: '🔄 End previous and start new', value: 'end-start' },
            { name: '▶️  Resume previous session', value: 'resume' },
            { name: '⚡ Force new (abandon previous)', value: 'force' },
          ],
        });

        if (choice === 'resume') {
          fmt.success(`▶️  Resumed session (${activeSession.sessionId})`);
          return;
        }

        if (choice === 'end-start' || choice === 'force') {
          const forceResult = await forceStartSession(root, activeSession);
          if (!forceResult.ok) {
            handleCommandError(fmt, forceResult.error);
            return;
          }
          await displayStarted(fmt, mode, forceResult.value, root);
          return;
        }

        return;
      }

      // Normal start
      await displayStarted(fmt, mode, startResult, root);
      // Fire plugin hook
      if (startResult.kind === 'started') {
        registry.invokeOnSessionStart(startResult.session.sessionId).catch(() => {});
      }
    });
};
